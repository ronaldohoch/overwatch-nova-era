import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
type RawRecord = Readonly<Record<string, unknown>>;

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

type SaveTournamentPayload = Readonly<{
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

type SaveTournamentResponse = Readonly<Record<string, unknown>>;

@Component({
  selector: 'app-torneios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './torneios.component.html',
  styleUrl: './torneios.component.css',
})
export class TorneiosComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;

  readonly tournamentId = signal<string | null>(null);
  readonly loadingTournament = signal(false);

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

  readonly editing = computed(() => !!this.tournamentId());
  readonly pageTitle = computed(() => (this.editing() ? 'Editar torneio' : 'Cadastrar torneio'));
  readonly pageDescription = computed(() =>
    this.editing()
      ? 'Edite os dados do torneio selecionado na listagem.'
      : 'Crie um torneio seguindo as mesmas regras da API de torneios.',
  );
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
    () =>
      this.auth.isAuthenticated() &&
      this.hasAdminPermission() &&
      !this.hasErrors() &&
      !this.loadingTournament() &&
      !this.pending(),
  );

  constructor() {
    const routeTournamentId = this.readRouteTournamentId();
    if (!routeTournamentId) return;

    this.tournamentId.set(routeTournamentId);
    void this.loadTournament(routeTournamentId);
  }

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
      this.message.set(
        this.editing()
          ? 'Apenas administradores podem editar torneios.'
          : 'Apenas administradores podem criar torneios.',
      );
      this.status.set('error');
      return;
    }

    if (!this.canSubmit()) return;

    this.pending.set(true);

    try {
      const payload = this.toPayload(this.form());
      const id = this.tournamentId();

      if (id) {
        await firstValueFrom(
          this.http.patch<SaveTournamentResponse>(`${this.torneiosApiUrl}/${id}`, payload),
        );

        this.message.set('Torneio atualizado com sucesso.');
        this.status.set('success');
      } else {
        const response = await firstValueFrom(
          this.http.post<SaveTournamentResponse>(this.torneiosApiUrl, payload),
        );

        const createdId = this.readString(response, 'id');
        this.createdTournamentId.set(createdId);
        this.message.set('Torneio cadastrado com sucesso.');
        this.status.set('success');
        this.resetForm();
      }
    } catch (error: unknown) {
      this.message.set(
        this.resolveError(
          error,
          this.editing()
            ? 'Nao foi possivel atualizar o torneio.'
            : 'Nao foi possivel cadastrar o torneio.',
        ),
      );
      this.status.set('error');
    } finally {
      this.pending.set(false);
    }
  }

  private async loadTournament(tournamentId: string): Promise<void> {
    this.loadingTournament.set(true);
    this.message.set(null);
    this.status.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.torneiosApiUrl}/${tournamentId}`),
      );

      if (!this.isRecord(response)) {
        throw new Error('Resposta invalida ao carregar torneio.');
      }

      this.form.set(this.toFormValue(response));
      this.resetTouchState();
      this.submitted.set(false);
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Nao foi possivel carregar os dados do torneio.'));
      this.status.set('error');
    } finally {
      this.loadingTournament.set(false);
    }
  }

  private toFormValue(value: RawRecord): TournamentFormValue {
    const rawTeamMode = (this.readString(value, 'teamMode') ?? 'random').toLowerCase();
    const teamMode: TeamMode = rawTeamMode === 'closed' ? 'closed' : 'random';
    const maxTeams = this.readInteger(value['maxTeams']) ?? 8;

    const roleSlotsRaw = this.readRecord(value['roleSlotsPerTeam']);
    const tank = this.readInteger(roleSlotsRaw?.['tank']) ?? 2;
    const dps = this.readInteger(roleSlotsRaw?.['dps']) ?? 3;
    const support = this.readInteger(roleSlotsRaw?.['support']) ?? 3;

    return {
      name: this.readString(value, 'name') ?? '',
      description: this.readString(value, 'description') ?? '',
      teamMode,
      maxTeams: String(maxTeams),
      startAt: this.toDateTimeLocalInput(this.readString(value, 'startAt')),
      checkinDeadlineAt: this.toDateTimeLocalInput(this.readString(value, 'checkinDeadlineAt')),
      tank: String(tank),
      dps: String(dps),
      support: String(support),
    };
  }

  private toDateTimeLocalInput(value: string | null): string {
    if (!value) return '';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';

    const two = (v: number) => String(v).padStart(2, '0');

    return [
      `${parsed.getFullYear()}-${two(parsed.getMonth() + 1)}-${two(parsed.getDate())}`,
      `${two(parsed.getHours())}:${two(parsed.getMinutes())}`,
    ].join('T');
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

    this.resetTouchState();
    this.submitted.set(false);
  }

  private resetTouchState(): void {
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
  }

  private toPayload(value: TournamentFormValue): SaveTournamentPayload {
    const maxTeams = Number.parseInt(value.maxTeams, 10);
    const payloadBase: SaveTournamentPayload = {
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

  private readRouteTournamentId(): string | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private readRecord(value: unknown): RawRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as RawRecord;
  }

  private readInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value.trim(), 10);
      return Number.isInteger(parsed) ? parsed : null;
    }

    return null;
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
