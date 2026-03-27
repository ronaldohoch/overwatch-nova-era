import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';

type RepescagemRole = 'flex' | 'tank' | 'dps' | 'support';
type SubmitStatus = 'success' | 'error';
type RawRecord = Readonly<Record<string, unknown>>;

type RepescagemConfig = Readonly<{
  role: RepescagemRole;
  slots: number;
  checkedIn: number;
}>;

type TournamentInfo = Readonly<{
  id: string;
  name: string;
  repescagem: RepescagemConfig | null;
}>;

const ROLE_LABELS: Record<RepescagemRole, string> = {
  flex: 'Flex',
  tank: 'Tanque',
  dps: 'DPS',
  support: 'Suporte',
};

const ALL_ROLES: readonly RepescagemRole[] = ['flex', 'tank', 'dps', 'support'];

@Component({
  selector: 'app-repescagem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './repescagem.component.html',
})
export class RepescagemComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;
  private readonly routeTournamentId = this.readRouteTournamentId();

  readonly allRoles = ALL_ROLES;
  readonly roleLabels = ROLE_LABELS;

  readonly loadingTournament = signal(false);
  readonly pendingSave = signal(false);
  readonly pendingDelete = signal(false);
  readonly tournament = signal<TournamentInfo | null>(null);
  readonly selectedRole = signal<RepescagemRole | null>(null);
  readonly slotsValue = signal('');
  readonly message = signal<string | null>(null);
  readonly messageStatus = signal<SubmitStatus | null>(null);

  readonly hasAdminPermission = computed(() => this.auth.userRole() === 'admin');
  readonly hasTournamentRouteParam = computed(() => !!this.routeTournamentId);
  readonly currentRepescagem = computed(() => this.tournament()?.repescagem ?? null);
  readonly canSave = computed(() => {
    if (!this.auth.isAuthenticated() || !this.hasAdminPermission()) return false;
    if (this.pendingSave() || this.pendingDelete() || this.loadingTournament()) return false;
    if (!this.selectedRole()) return false;
    const slots = Number.parseInt(this.slotsValue(), 10);
    return Number.isInteger(slots) && slots >= 1;
  });
  readonly canDelete = computed(() => {
    if (!this.auth.isAuthenticated() || !this.hasAdminPermission()) return false;
    if (this.pendingSave() || this.pendingDelete() || this.loadingTournament()) return false;
    return !!this.currentRepescagem();
  });

  constructor() {
    if (!this.routeTournamentId) return;
    void this.loadTournament(this.routeTournamentId);
  }

  onRoleChange(role: RepescagemRole): void {
    this.selectedRole.set(role);
  }

  onSlotsChange(value: string): void {
    this.slotsValue.set(value);
  }

  async onSave(event: Event): Promise<void> {
    event.preventDefault();
    this.message.set(null);
    this.messageStatus.set(null);

    if (!this.canSave()) return;

    const tournamentId = this.routeTournamentId!;
    const role = this.selectedRole()!;
    const slots = Number.parseInt(this.slotsValue(), 10);

    this.pendingSave.set(true);

    try {
      await firstValueFrom(
        this.http.post<unknown>(`${this.torneiosApiUrl}/${tournamentId}/repescagem`, { role, slots }),
      );

      this.tournament.update((current) =>
        current
          ? {
              ...current,
              repescagem: {
                role,
                slots,
                checkedIn: current.repescagem?.checkedIn ?? 0,
              },
            }
          : current,
      );

      this.message.set('Repescagem configurada com sucesso.');
      this.messageStatus.set('success');
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Não foi possível configurar a repescagem.'));
      this.messageStatus.set('error');
    } finally {
      this.pendingSave.set(false);
    }
  }

  async onDelete(event: Event): Promise<void> {
    event.preventDefault();
    this.message.set(null);
    this.messageStatus.set(null);

    if (!this.canDelete()) return;

    const tournamentId = this.routeTournamentId!;
    this.pendingDelete.set(true);

    try {
      await firstValueFrom(
        this.http.delete<unknown>(`${this.torneiosApiUrl}/${tournamentId}/repescagem`),
      );

      this.tournament.update((current) =>
        current ? { ...current, repescagem: null } : current,
      );
      this.selectedRole.set(null);
      this.slotsValue.set('');
      this.message.set('Configuração de repescagem removida.');
      this.messageStatus.set('success');
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Não foi possível remover a repescagem.'));
      this.messageStatus.set('error');
    } finally {
      this.pendingDelete.set(false);
    }
  }

  roleLabelOf(role: RepescagemRole): string {
    return ROLE_LABELS[role];
  }

  private async loadTournament(id: string): Promise<void> {
    this.loadingTournament.set(true);
    this.message.set(null);
    this.messageStatus.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.torneiosApiUrl}/${id}`),
      );

      if (!this.isRecord(response)) throw new Error('Resposta inválida.');

      const name = this.readString(response, 'name') ?? 'Torneio sem nome';
      const repescagem = this.readRepescagem(response['repescagem']);

      this.tournament.set({ id, name, repescagem });

      if (repescagem) {
        this.selectedRole.set(repescagem.role);
        this.slotsValue.set(String(repescagem.slots));
      }
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Não foi possível carregar os dados do torneio.'));
      this.messageStatus.set('error');
    } finally {
      this.loadingTournament.set(false);
    }
  }

  private readRepescagem(value: unknown): RepescagemConfig | null {
    if (!this.isRecord(value)) return null;

    const roleRaw = this.readString(value, 'role');
    if (roleRaw !== 'flex' && roleRaw !== 'tank' && roleRaw !== 'dps' && roleRaw !== 'support') {
      return null;
    }

    const slots = this.readPositiveInteger(value['slots']);
    if (slots == null) return null;

    const checkedIn = this.readNonNegativeInteger(value['checkedIn']) ?? 0;

    return { role: roleRaw, slots, checkedIn };
  }

  private readRouteTournamentId(): string | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim();
    return normalized || null;
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim();
    return normalized || null;
  }

  private readPositiveInteger(value: unknown): number | null {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) return null;
    return n;
  }

  private readNonNegativeInteger(value: unknown): number | null {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return null;
    return n;
  }

  private isRecord(value: unknown): value is RawRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private resolveError(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error?.message === 'string'
          ? error.error.message
          : typeof error.error?.error === 'string'
            ? error.error.error
            : null;

      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }
}
