import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { environment } from '../../../../../environments/environment';

type Role = 'tank' | 'dps' | 'support';
type RepescagemRole = 'flex' | 'tank' | 'dps' | 'support';
type SubmitStatus = 'success' | 'error';
type RoleAvailabilityItem = Readonly<{
  total: number;
  checkedIn: number;
  available: number;
}>;
type RoleAvailabilityResponse = Readonly<{
  tournamentId: string;
  totals: RoleAvailabilityItem;
  roles: Readonly<{
    tank: RoleAvailabilityItem;
    dps: RoleAvailabilityItem;
    support: RoleAvailabilityItem;
  }>;
}>;

type TournamentListItem = Readonly<{
  id: string;
  name: string;
  status: string;
  teamMode: string;
  checkinDeadlineAt: string | null;
  checkinAllowed: boolean;
  checkinReason: string | null;
  repescagem: Readonly<{
    role: RepescagemRole;
    slots: number;
    checkedIn: number;
  }> | null;
}>;

type RawRecord = Readonly<Record<string, unknown>>;
const LOCAL_TOURNAMENT_ID = 'xD3cLnQMNxpv4knH81xV';

@Component({
  selector: 'app-check-ins',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './check-ins.component.html',
  styleUrl: './check-ins.component.css',
})
export class CheckInsComponent {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);
  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;
  readonly localTournamentId = LOCAL_TOURNAMENT_ID;

  readonly loadingTournaments = signal(false);
  readonly loadingRoleAvailability = signal(false);
  readonly tournaments = signal<readonly TournamentListItem[]>([]);
  readonly selectedTournamentId = signal('');
  readonly selectedRole = signal<Role>('tank');
  readonly submitting = signal(false);
  readonly message = signal<string | null>(null);
  readonly roleAvailability = signal<RoleAvailabilityResponse | null>(null);
  readonly roleAvailabilityError = signal<string | null>(null);
  readonly status = signal<SubmitStatus | null>(null);
  readonly checkedInTournamentIds = signal<readonly string[]>([]);

  readonly availableRoles: readonly Role[] = ['tank', 'dps', 'support'];

  // Repescagem state
  readonly selectedRepescagemTournamentId = signal('');
  readonly submittingRepescagem = signal(false);
  readonly repescagemMessage = signal<string | null>(null);
  readonly repescagemStatus = signal<SubmitStatus | null>(null);
  readonly checkedInRepescagemTournamentIds = signal<readonly string[]>([]);

  readonly tournamentOptions = computed(() => this.tournaments());
  readonly selectedTournament = computed(() =>
    this.tournamentOptions().find((item) => item.id === this.selectedTournamentId()) ?? null,
  );

  readonly repescagemTournamentOptions = computed(() =>
    this.tournamentOptions().filter((item) => item.repescagem !== null),
  );

  readonly selectedRepescagemTournament = computed(() =>
    this.repescagemTournamentOptions().find(
      (item) => item.id === this.selectedRepescagemTournamentId(),
    ) ?? null,
  );

  readonly canSubmitRepescagem = computed(() => {
    if (!this.auth.isAuthenticated()) return false;
    const tournament = this.selectedRepescagemTournament();
    if (!tournament?.repescagem) return false;
    if (this.checkedInRepescagemTournamentIds().includes(tournament.id)) return false;
    if (this.submittingRepescagem()) return false;
    const { slots, checkedIn } = tournament.repescagem;
    return checkedIn < slots;
  });

  readonly canSubmit = computed(
    () =>
      this.auth.isAuthenticated() &&
      !!this.selectedTournament() &&
      !this.checkedInTournamentIds().includes(this.selectedTournamentId()) &&
      !this.submitting(),
  );

  constructor() {
    void this.loadTournaments();
    if (this.auth.isAuthenticated()) {
      void this.loadRoleAvailability();
    }
  }

  async loadTournaments(): Promise<void> {
    this.loadingTournaments.set(true);
    this.message.set(null);
    this.status.set(null);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.torneiosApiUrl));
      const tournaments = this.readTournaments(response).map((item) => this.toTournamentListItem(item));
      this.tournaments.set(tournaments);

      if (!this.tournamentOptions().some((item) => item.id === this.selectedTournamentId())) {
        this.selectedTournamentId.set('');
      }
    } catch (error: unknown) {
      this.tournaments.set([]);
      this.selectedTournamentId.set('');
      this.message.set(this.resolveError(error, 'Não foi possível carregar os torneios.'));
      this.status.set('error');
    } finally {
      this.loadingTournaments.set(false);
    }
  }

  onTournamentChange(value: string): void {
    this.selectedTournamentId.set(value);
  }

  onRoleChange(value: string): void {
    if (value === 'tank' || value === 'dps' || value === 'support') {
      this.selectedRole.set(value);
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.message.set(null);
    this.status.set(null);

    if (!this.auth.isAuthenticated()) {
      this.message.set('Sua sessão expirou. Faça login novamente.');
      this.status.set('error');
      return;
    }

    const tournament = this.selectedTournament();
    if (!tournament) {
      this.message.set('Selecione um torneio válido para check-in.');
      this.status.set('error');
      return;
    }

    if (!tournament.checkinAllowed) {
      this.message.set(tournament.checkinReason ?? 'Este torneio não está disponível para check-in.');
      this.status.set('error');
      return;
    }

    if (this.checkedInTournamentIds().includes(tournament.id)) {
      this.message.set('Você já realizou check-in neste torneio.');
      this.status.set('error');
      return;
    }

    if (!this.canSubmit()) return;

    this.submitting.set(true);

    try {
      await firstValueFrom(
        this.http.post(`${this.torneiosApiUrl}/${tournament.id}/checkin`, {
          role: this.selectedRole(),
        }),
      );

      this.checkedInTournamentIds.update((current) => [...current, tournament.id]);
      this.selectedTournamentId.set('');
      this.message.set('Check-in realizado com sucesso.');
      this.status.set('success');
      if (tournament.id === this.localTournamentId) {
        void this.loadRoleAvailability();
      }
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Não foi possível realizar o check-in.'));
      this.status.set('error');
    } finally {
      this.submitting.set(false);
    }
  }

  onRepescagemTournamentChange(value: string): void {
    this.selectedRepescagemTournamentId.set(value);
  }

  async onRepescagemSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.repescagemMessage.set(null);
    this.repescagemStatus.set(null);

    if (!this.auth.isAuthenticated()) {
      this.repescagemMessage.set('Sua sessão expirou. Faça login novamente.');
      this.repescagemStatus.set('error');
      return;
    }

    const tournament = this.selectedRepescagemTournament();
    if (!tournament?.repescagem) {
      this.repescagemMessage.set('Selecione um torneio com repescagem disponível.');
      this.repescagemStatus.set('error');
      return;
    }

    if (this.checkedInRepescagemTournamentIds().includes(tournament.id)) {
      this.repescagemMessage.set('Você já realizou check-in na repescagem deste torneio.');
      this.repescagemStatus.set('error');
      return;
    }

    if (!this.canSubmitRepescagem()) return;

    this.submittingRepescagem.set(true);

    try {
      await firstValueFrom(
        this.http.post(`${this.torneiosApiUrl}/${tournament.id}/repescagem/checkin`, {}),
      );

      this.checkedInRepescagemTournamentIds.update((current) => [...current, tournament.id]);
      this.selectedRepescagemTournamentId.set('');
      this.repescagemMessage.set('Check-in de repescagem realizado com sucesso.');
      this.repescagemStatus.set('success');
    } catch (error: unknown) {
      this.repescagemMessage.set(
        this.resolveError(error, 'Não foi possível realizar o check-in de repescagem.'),
      );
      this.repescagemStatus.set('error');
    } finally {
      this.submittingRepescagem.set(false);
    }
  }

  repescagemRoleLabel(role: RepescagemRole): string {
    if (role === 'flex') return 'Flex';
    if (role === 'tank') return 'Tanque';
    if (role === 'dps') return 'DPS';
    if (role === 'support') return 'Suporte';
    return role;
  }

  formatRepescagemTournamentLabel(item: TournamentListItem): string {
    if (!item.repescagem) return item.name;
    const { role, slots, checkedIn } = item.repescagem;
    const available = slots - checkedIn;
    const alreadyCheckedIn = this.checkedInRepescagemTournamentIds().includes(item.id);
    const state = alreadyCheckedIn
      ? 'check-in já realizado'
      : available > 0
        ? `${available} vaga(s) disponível(eis)`
        : 'sem vagas';
    return `${item.name} | role: ${this.repescagemRoleLabel(role)} | ${state}`;
  }

  formatTournamentLabel(item: TournamentListItem): string {
    const deadline = item.checkinDeadlineAt ? this.toLocale(item.checkinDeadlineAt) : 'sem prazo';
    const checkinState = this.checkedInTournamentIds().includes(item.id)
      ? 'check-in já realizado'
      : item.checkinAllowed
        ? 'check-in aberto'
        : item.checkinReason ?? 'check-in indisponível';

    return `${item.name} | status: ${item.status} | prazo: ${deadline} | ${checkinState}`;
  }

  async loadRoleAvailability(): Promise<void> {
    this.roleAvailabilityError.set(null);

    if (!this.auth.isAuthenticated()) {
      this.roleAvailability.set(null);
      this.roleAvailabilityError.set('Faça login para consultar a disponibilidade por role.');
      return;
    }

    this.loadingRoleAvailability.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(
          `${this.torneiosApiUrl}/${this.localTournamentId}/checkins/availability-by-role`,
        ),
      );
      const parsed = this.readRoleAvailabilityResponse(response);

      if (!parsed) {
        throw new Error('Resposta de disponibilidade por role inválida.');
      }

      this.roleAvailability.set(parsed);
    } catch (error: unknown) {
      this.roleAvailability.set(null);
      this.roleAvailabilityError.set(
        this.resolveError(error, 'Não foi possível carregar a disponibilidade por role.'),
      );
    } finally {
      this.loadingRoleAvailability.set(false);
    }
  }

  private readTournaments(value: unknown): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    if (!this.isRecord(value)) return [];

    for (const key of ['data', 'items', 'results', 'tournaments']) {
      const maybeArray = value[key];
      if (!Array.isArray(maybeArray)) continue;

      return maybeArray.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private readRoleAvailabilityResponse(value: unknown): RoleAvailabilityResponse | null {
    if (!this.isRecord(value)) return null;

    const totals = this.readRoleAvailabilityItem(value['totals']);
    const roles = value['roles'];
    if (!totals || !this.isRecord(roles)) return null;

    const tank = this.readRoleAvailabilityItem(roles['tank']);
    const dps = this.readRoleAvailabilityItem(roles['dps']);
    const support = this.readRoleAvailabilityItem(roles['support']);
    if (!tank || !dps || !support) return null;

    return {
      tournamentId: this.readString(value, 'tournamentId') ?? this.localTournamentId,
      totals,
      roles: {
        tank,
        dps,
        support,
      },
    };
  }

  private toTournamentListItem(value: RawRecord): TournamentListItem {
    const id = this.readString(value, 'id') ?? '';
    const name = this.readString(value, 'name') ?? 'Torneio sem nome';
    const status = (this.readString(value, 'status') ?? '').toLowerCase();
    const teamMode = (this.readString(value, 'teamMode') ?? '').toLowerCase();
    const checkinDeadlineAt = this.readString(value, 'checkinDeadlineAt');
    const { allowed, reason } = this.resolveCheckinAvailability({
      id,
      status,
      teamMode,
      checkinDeadlineAt,
    });

    return {
      id,
      name,
      status: status || 'desconhecido',
      teamMode: teamMode || 'desconhecido',
      checkinDeadlineAt,
      checkinAllowed: allowed,
      checkinReason: reason,
      repescagem: this.readRepescagem(value['repescagem']),
    };
  }

  private readRepescagem(
    value: unknown,
  ): TournamentListItem['repescagem'] {
    if (!this.isRecord(value)) return null;

    const roleRaw = typeof value['role'] === 'string' ? value['role'].trim().toLowerCase() : '';
    if (roleRaw !== 'flex' && roleRaw !== 'tank' && roleRaw !== 'dps' && roleRaw !== 'support') {
      return null;
    }

    const slots = Number(value['slots']);
    if (!Number.isInteger(slots) || slots < 1) return null;

    const checkedIn = Math.max(0, Math.floor(Number(value['checkedIn']) || 0));

    return { role: roleRaw as RepescagemRole, slots, checkedIn };
  }

  private resolveCheckinAvailability(data: {
    id: string;
    status: string;
    teamMode: string;
    checkinDeadlineAt: string | null;
  }): Readonly<{ allowed: boolean; reason: string | null }> {
    if (!data.id) {
      return { allowed: false, reason: 'Torneio inválido.' };
    }

    if (data.teamMode !== 'random') {
      return { allowed: false, reason: 'Este torneio usa time fechado (check-in de time).' };
    }

    if (!(data.status === 'published' || data.status === 'checkin')) {
      return { allowed: false, reason: `Check-in fechado para o status atual (${data.status || 'desconhecido'}).` };
    }

    if (!data.checkinDeadlineAt) {
      return { allowed: false, reason: 'Prazo de check-in não informado.' };
    }

    const checkinDeadlineTimestamp = new Date(data.checkinDeadlineAt).getTime();
    if (!Number.isFinite(checkinDeadlineTimestamp)) {
      return { allowed: false, reason: 'Prazo de check-in inválido.' };
    }

    if (checkinDeadlineTimestamp < Date.now()) {
      return { allowed: false, reason: 'Prazo de check-in encerrado.' };
    }

    return { allowed: true, reason: null };
  }

  private toLocale(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(parsed);
  }

  private readRoleAvailabilityItem(value: unknown): RoleAvailabilityItem | null {
    if (!this.isRecord(value)) return null;

    const total = this.readNonNegativeInteger(value['total']);
    const checkedIn = this.readNonNegativeInteger(value['checkedIn']);
    const available = this.readNonNegativeInteger(value['available']);

    if (total == null || checkedIn == null || available == null) return null;

    return { total, checkedIn, available };
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private readNonNegativeInteger(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    if (value < 0) return null;
    return Math.floor(value);
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
