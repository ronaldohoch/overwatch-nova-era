import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { environment } from '../../../../../environments/environment';

const ROSTER_MAX_PER_TEAM = 8;

const TOURNAMENT_FIELDS = [
  'name',
  'description',
  'teamMode',
  'maxTeams',
  'startAt',
  'checkinDeadlineAt',
  'tank',
  'dps',
  'support',
] as const;

type TeamMode = 'random' | 'closed';
type SubmitStatus = 'success' | 'error';
type TournamentField = (typeof TOURNAMENT_FIELDS)[number];

type TournamentFormValue = Readonly<{
  name: string;
  description: string;
  teamMode: TeamMode;
  maxTeams: string;
  startAt: string;
  checkinDeadlineAt: string;
  tank: string;
  dps: string;
  support: string;
}>;

type TournamentErrors = Readonly<Record<TournamentField, string[]>>;

type CreateTournamentPayload = Readonly<{
  name: string;
  description: string | null;
  teamMode: TeamMode;
  maxTeams: number;
  startAt: string;
  checkinDeadlineAt: string;
  roleSlotsPerTeam?: Readonly<{
    tank: number;
    dps: number;
    support: number;
  }>;
}>;

type CreateTournamentResponse = Readonly<Record<string, unknown>>;

@Component({
  selector: 'app-torneios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './torneios.component.html',
  styleUrl: './torneios.component.css',
})
export class TorneiosComponent {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  private readonly torneiosApiUrl = `${environment.apiURL}/torneios`;

  readonly form = signal<TournamentFormValue>({
    name: '',
    description: '',
    teamMode: 'random',
    maxTeams: '8',
    startAt: '',
    checkinDeadlineAt: '',
    tank: '2',
    dps: '3',
    support: '3',
  });

  readonly touched = signal<Record<TournamentField, boolean>>({
    name: false,
    description: false,
    teamMode: false,
    maxTeams: false,
    startAt: false,
    checkinDeadlineAt: false,
    tank: false,
    dps: false,
    support: false,
  });

  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly message = signal<string | null>(null);
  readonly status = signal<SubmitStatus | null>(null);
  readonly createdTournamentId = signal<string | null>(null);

  readonly isRandomMode = computed(() => this.form().teamMode === 'random');
  readonly errors = computed<TournamentErrors>(() => this.validateForm(this.form()));
  readonly hasErrors = computed(() =>
    TOURNAMENT_FIELDS.some((field) => this.errors()[field].length > 0),
  );
  readonly hasAdminPermission = computed(() => {
    const role = this.auth.userRole();
    if (!role) return true;

    return role === 'admin';
  });
  readonly canSubmit = computed(
    () => this.auth.isAuthenticated() && this.hasAdminPermission() && !this.hasErrors(),
  );

  updateField(field: TournamentField, value: string): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  markTouched(field: TournamentField): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
  }

  fieldError(field: TournamentField): string | null {
    const shouldShow = this.submitted() || this.touched()[field];
    if (!shouldShow) return null;

    const [firstError] = this.errors()[field];
    return firstError ?? null;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.message.set(null);
    this.status.set(null);
    this.createdTournamentId.set(null);

    if (!this.auth.isAuthenticated()) {
      this.message.set('Sua sessao expirou. Faca login novamente.');
      this.status.set('error');
      return;
    }

    if (!this.hasAdminPermission()) {
      this.message.set('Apenas administradores podem criar torneios.');
      this.status.set('error');
      return;
    }

    if (!this.canSubmit()) return;

    this.pending.set(true);

    try {
      const payload = this.toPayload(this.form());
      const response = await firstValueFrom(
        this.http.post<CreateTournamentResponse>(this.torneiosApiUrl, payload),
      );

      const createdId = this.readString(response, 'id');
      this.createdTournamentId.set(createdId);
      this.message.set('Torneio cadastrado com sucesso.');
      this.status.set('success');
      this.resetForm();
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Nao foi possivel cadastrar o torneio.'));
      this.status.set('error');
    } finally {
      this.pending.set(false);
    }
  }

  private resetForm(): void {
    this.form.set({
      name: '',
      description: '',
      teamMode: 'random',
      maxTeams: '8',
      startAt: '',
      checkinDeadlineAt: '',
      tank: '2',
      dps: '3',
      support: '3',
    });

    this.touched.set({
      name: false,
      description: false,
      teamMode: false,
      maxTeams: false,
      startAt: false,
      checkinDeadlineAt: false,
      tank: false,
      dps: false,
      support: false,
    });

    this.submitted.set(false);
  }

  private toPayload(value: TournamentFormValue): CreateTournamentPayload {
    const maxTeams = Number.parseInt(value.maxTeams, 10);
    const payloadBase: CreateTournamentPayload = {
      name: value.name.trim(),
      description: value.description.trim() ? value.description.trim() : null,
      teamMode: value.teamMode,
      maxTeams,
      startAt: this.toIsoDate(value.startAt),
      checkinDeadlineAt: this.toIsoDate(value.checkinDeadlineAt),
    };

    if (value.teamMode !== 'random') {
      return payloadBase;
    }

    return {
      ...payloadBase,
      roleSlotsPerTeam: {
        tank: Number.parseInt(value.tank, 10),
        dps: Number.parseInt(value.dps, 10),
        support: Number.parseInt(value.support, 10),
      },
    };
  }

  private toIsoDate(localDateTime: string): string {
    return new Date(localDateTime).toISOString();
  }

  private validateForm(value: TournamentFormValue): TournamentErrors {
    const nameErrors: string[] = [];
    const descriptionErrors: string[] = [];
    const teamModeErrors: string[] = [];
    const maxTeamsErrors: string[] = [];
    const startAtErrors: string[] = [];
    const checkinDeadlineAtErrors: string[] = [];
    const tankErrors: string[] = [];
    const dpsErrors: string[] = [];
    const supportErrors: string[] = [];

    if (!value.name.trim()) {
      nameErrors.push('Informe o nome do torneio.');
    }

    if (value.description.trim().length > 240) {
      descriptionErrors.push('Descricao deve ter no maximo 240 caracteres.');
    }

    if (value.teamMode !== 'random' && value.teamMode !== 'closed') {
      teamModeErrors.push('Modo de times invalido.');
    }

    const maxTeams = Number.parseInt(value.maxTeams, 10);
    if (!Number.isInteger(maxTeams) || maxTeams <= 0) {
      maxTeamsErrors.push('maxTeams deve ser um inteiro maior que zero.');
    } else {
      if (maxTeams % 2 !== 0) {
        maxTeamsErrors.push('maxTeams deve ser par (4, 8, 16...).');
      }

      if ((maxTeams & (maxTeams - 1)) !== 0) {
        maxTeamsErrors.push('maxTeams deve ser potencia de 2 (4, 8, 16...).');
      }
    }

    const startAtDate = this.parseDate(value.startAt);
    if (!startAtDate) {
      startAtErrors.push('Informe uma data valida de inicio.');
    }

    const deadlineDate = this.parseDate(value.checkinDeadlineAt);
    if (!deadlineDate) {
      checkinDeadlineAtErrors.push('Informe uma data valida para fim do check-in.');
    }

    if (startAtDate && deadlineDate && deadlineDate.getTime() >= startAtDate.getTime()) {
      checkinDeadlineAtErrors.push('checkinDeadlineAt deve ser antes de startAt.');
    }

    if (value.teamMode === 'random') {
      const tank = Number.parseInt(value.tank, 10);
      const dps = Number.parseInt(value.dps, 10);
      const support = Number.parseInt(value.support, 10);

      this.validateSlotValue('tank', tank, tankErrors);
      this.validateSlotValue('dps', dps, dpsErrors);
      this.validateSlotValue('support', support, supportErrors);

      if (!tankErrors.length && !dpsErrors.length && !supportErrors.length) {
        const sum = tank + dps + support;
        if (sum !== ROSTER_MAX_PER_TEAM) {
          const message = `A soma dos slots deve ser ${ROSTER_MAX_PER_TEAM} (atual: ${sum}).`;
          tankErrors.push(message);
          dpsErrors.push(message);
          supportErrors.push(message);
        }
      }
    }

    return {
      name: nameErrors,
      description: descriptionErrors,
      teamMode: teamModeErrors,
      maxTeams: maxTeamsErrors,
      startAt: startAtErrors,
      checkinDeadlineAt: checkinDeadlineAtErrors,
      tank: tankErrors,
      dps: dpsErrors,
      support: supportErrors,
    };
  }

  private validateSlotValue(field: string, slot: number, errors: string[]): void {
    if (!Number.isInteger(slot) || slot < 0) {
      errors.push(`${field} deve ser inteiro maior ou igual a zero.`);
    }
  }

  private parseDate(value: string): Date | null {
    if (!value.trim()) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed;
  }

  private readString(value: Readonly<Record<string, unknown>>, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
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
