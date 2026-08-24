import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';

type RawRecord = Readonly<Record<string, unknown>>;

type TournamentSummary = Readonly<{
  id: string;
  name: string;
  status: string;
  statusLabel: string;
  teamMode: string;
  teamModeLabel: string;
  maxTeams: number;
  checkinDeadlineLabel: string;
}>;

type TournamentTeamItem = Readonly<{
  teamId: string;
  name: string;
  tag: string | null;
  membersCount: number;
  checkedIn: boolean;
  /** Nulo quando o time nao passou por check-in ou o registro nao guardou a autoria. */
  checkinAuthorLabel: string | null;
  sourceLabel: string;
}>;

type GlobalTeamItem = Readonly<{
  id: string;
  name: string;
  tag: string | null;
  captainName: string;
  hasCaptain: boolean;
  membersCount: number;
}>;

@Component({
  selector: 'app-torneio-times',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, CardComponent],
  templateUrl: './torneio-times.component.html',
})
export class TorneioTimesComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;
  private readonly timesApiUrl = `${environment.apiURLTimes}`;
  private readonly tournamentId = (this.route.snapshot.paramMap.get('id') ?? '').trim();

  readonly tournament = signal<TournamentSummary | null>(null);
  readonly tournamentTeams = signal<readonly TournamentTeamItem[]>([]);
  readonly globalTeams = signal<readonly GlobalTeamItem[]>([]);

  readonly loadingTournament = signal(false);
  readonly loadingTeams = signal(false);
  readonly loadingGlobalTeams = signal(false);
  readonly loadingMessage = signal<string | null>(null);

  readonly search = signal('');
  readonly pendingTeamId = signal<string | null>(null);
  /** Confirmacao da ultima acao concluida, exibida no topo da pagina. */
  readonly actionMessage = signal<string | null>(null);
  /** Erro da ultima acao, exibido no card do time que a originou. */
  readonly teamError = signal<{ teamId: string; message: string } | null>(null);

  readonly hasTournamentId = computed(() => !!this.tournamentId);
  readonly isAdmin = computed(() => this.auth.userRole() === 'admin');
  readonly isLoading = computed(
    () => this.loadingTournament() || this.loadingTeams() || this.loadingGlobalTeams(),
  );
  readonly checkedInCount = computed(
    () => this.tournamentTeams().filter((team) => team.checkedIn).length,
  );
  readonly isRandomTournament = computed(() => this.tournament()?.teamMode === 'random');
  readonly slotsLabel = computed(() => {
    const maxTeams = this.tournament()?.maxTeams ?? 0;
    if (maxTeams <= 0) return `${this.checkedInCount()} time(s) com check-in`;
    return `${this.checkedInCount()}/${maxTeams} vagas preenchidas`;
  });

  /** Times globais que ainda nao estao inscritos, filtrados pela busca. */
  readonly selectableTeams = computed(() => {
    const alreadyIn = new Set(this.tournamentTeams().map((team) => team.teamId));
    const term = this.search().trim().toLowerCase();

    return this.globalTeams()
      .filter((team) => !alreadyIn.has(team.id))
      .filter((team) => {
        if (!term) return true;
        return (
          team.name.toLowerCase().includes(term) ||
          (team.tag ?? '').toLowerCase().includes(term) ||
          team.captainName.toLowerCase().includes(term)
        );
      });
  });

  constructor() {
    void this.loadPage();
  }

  updateSearch(value: string): void {
    this.search.set(value);
  }

  isPendingTeam(teamId: string): boolean {
    return this.pendingTeamId() === teamId;
  }

  errorForTeam(teamId: string): string | null {
    const current = this.teamError();
    return current?.teamId === teamId ? current.message : null;
  }

  /** Time sem capitão não pode ser inscrito: o check-in exige um capitão definido. */
  canAddTeam(team: GlobalTeamItem): boolean {
    return this.isAdmin() && team.hasCaptain && this.pendingTeamId() === null;
  }

  async onAddTeam(team: GlobalTeamItem): Promise<void> {
    this.actionMessage.set(null);
    this.teamError.set(null);

    if (!this.isAdmin()) {
      this.teamError.set({
        teamId: team.id,
        message: 'Apenas admin pode adicionar times ao torneio.',
      });
      return;
    }

    if (!team.hasCaptain) {
      this.teamError.set({
        teamId: team.id,
        message: 'Defina um capitão para o time antes de inscrevê-lo no torneio.',
      });
      return;
    }

    if (this.pendingTeamId()) return;

    this.pendingTeamId.set(team.id);

    try {
      await firstValueFrom(
        this.http.post<unknown>(
          `${this.torneiosApiUrl}/${encodeURIComponent(this.tournamentId)}/teams/${encodeURIComponent(team.id)}/checkin`,
          {},
        ),
      );

      this.actionMessage.set(`${team.name} adicionado ao torneio com check-in.`);

      await Promise.all([this.loadTournament(), this.loadTournamentTeams()]);
    } catch (error: unknown) {
      this.teamError.set({
        teamId: team.id,
        message: this.resolveError(error, 'Não foi possível adicionar o time.'),
      });
    } finally {
      this.pendingTeamId.set(null);
    }
  }

  async onRemoveTeam(team: TournamentTeamItem): Promise<void> {
    this.actionMessage.set(null);
    this.teamError.set(null);

    if (!this.isAdmin()) {
      this.teamError.set({
        teamId: team.teamId,
        message: 'Apenas admin pode remover times do torneio.',
      });
      return;
    }

    if (this.pendingTeamId()) return;

    this.pendingTeamId.set(team.teamId);

    try {
      await firstValueFrom(
        this.http.delete<unknown>(
          `${this.torneiosApiUrl}/${encodeURIComponent(this.tournamentId)}/teams/${encodeURIComponent(team.teamId)}/checkin`,
        ),
      );

      this.actionMessage.set(`${team.name} removido do torneio.`);

      await Promise.all([this.loadTournament(), this.loadTournamentTeams()]);
    } catch (error: unknown) {
      this.teamError.set({
        teamId: team.teamId,
        message: this.resolveError(error, 'Não foi possível remover o time.'),
      });
    } finally {
      this.pendingTeamId.set(null);
    }
  }

  private async loadPage(): Promise<void> {
    this.loadingMessage.set(null);

    if (!this.hasTournamentId()) {
      this.loadingMessage.set('Torneio inválido.');
      return;
    }

    try {
      await Promise.all([
        this.loadTournament(),
        this.loadTournamentTeams(),
        this.loadGlobalTeams(),
      ]);
    } catch (error: unknown) {
      this.loadingMessage.set(this.resolveError(error, 'Não foi possível carregar o torneio.'));
    }
  }

  private async loadTournament(): Promise<void> {
    this.loadingTournament.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.torneiosApiUrl}/${this.tournamentId}`),
      );
      const record = this.readRecord(response);
      if (!record) throw new Error('Torneio não encontrado.');

      const status = (this.readString(record, 'status') ?? 'desconhecido').toLowerCase();
      const teamMode = (this.readString(record, 'teamMode') ?? '').toLowerCase();

      this.tournament.set({
        id: this.readString(record, 'id') ?? this.tournamentId,
        name: this.readString(record, 'name') ?? 'Torneio sem nome',
        status,
        statusLabel: this.toStatusLabel(status),
        teamMode,
        teamModeLabel: this.toTeamModeLabel(teamMode),
        maxTeams: this.readInteger(record['maxTeams']) ?? 0,
        checkinDeadlineLabel: this.toDateTimeLabel(this.readString(record, 'checkinDeadlineAt')),
      });
    } finally {
      this.loadingTournament.set(false);
    }
  }

  private async loadTournamentTeams(): Promise<void> {
    this.loadingTeams.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.torneiosApiUrl}/${this.tournamentId}/teams`),
      );

      const teams = this.readRecords(response, ['teams', 'data', 'items', 'results']).map((item) =>
        this.toTournamentTeamItem(item),
      );

      this.tournamentTeams.set(teams);
    } finally {
      this.loadingTeams.set(false);
    }
  }

  private async loadGlobalTeams(): Promise<void> {
    this.loadingGlobalTeams.set(true);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.timesApiUrl));
      const teams = this.readRecords(response, ['teams', 'data', 'items', 'results'])
        .map((item) => this.toGlobalTeamItem(item))
        .filter((team) => !!team.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      this.globalTeams.set(teams);
    } catch {
      this.globalTeams.set([]);
    } finally {
      this.loadingGlobalTeams.set(false);
    }
  }

  private toTournamentTeamItem(value: RawRecord): TournamentTeamItem {
    const checkedIn = value['checkedIn'] === true;
    const source = this.readString(value, 'source') ?? '';

    return {
      teamId: this.readString(value, 'teamId') ?? this.readString(value, 'id') ?? '',
      name: this.readString(value, 'name') ?? 'Time sem nome',
      tag: this.readString(value, 'tag'),
      membersCount: this.readInteger(value['membersCount']) ?? 0,
      checkedIn,
      checkinAuthorLabel: this.toCheckinAuthorLabel(value, checkedIn),
      sourceLabel: source === 'global_team' ? 'Time cadastrado' : 'Time criado no torneio',
    };
  }

  /**
   * Times sorteados e check-ins anteriores a este recurso nao guardam autoria,
   * entao nesses casos a linha nao é exibida com placeholders vazios.
   */
  private toCheckinAuthorLabel(value: RawRecord, checkedIn: boolean): string | null {
    if (!checkedIn) return null;

    const who =
      this.readString(value, 'checkedInByName') ?? this.readString(value, 'checkedInByUid');
    if (!who) return 'Autoria do check-in não registrada';

    const role = (this.readString(value, 'checkedInByRole') ?? '').toLowerCase();
    const roleLabel = role === 'admin' ? ' (admin)' : role === 'captain' ? ' (capitão)' : '';
    const at = this.readString(value, 'checkedInAt');

    return at
      ? `Check-in por: ${who}${roleLabel} em ${this.toDateTimeLabel(at)}`
      : `Check-in por: ${who}${roleLabel}`;
  }

  private toGlobalTeamItem(value: RawRecord): GlobalTeamItem {
    const captainUid = this.readString(value, 'captainUid');

    return {
      id: this.readString(value, 'id') ?? '',
      name: this.readString(value, 'name') ?? 'Time sem nome',
      tag: this.readString(value, 'tag'),
      captainName:
        this.readString(value, 'captainName') ??
        this.readString(value, 'captainDisplayName') ??
        'Sem capitão definido',
      hasCaptain: !!captainUid,
      membersCount: this.readInteger(value['membersCount']) ?? 0,
    };
  }

  private readRecords(value: unknown, wrapperKeys: readonly string[]): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    const root = this.readRecord(value);
    if (!root) return [];

    for (const key of wrapperKeys) {
      const nested = root[key];
      if (!Array.isArray(nested)) continue;
      return nested.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private toTeamModeLabel(value: string): string {
    if (value === 'random') return 'Times sorteados';
    if (value === 'closed') return 'Times fechados';
    return 'Modo desconhecido';
  }

  private toStatusLabel(status: string): string {
    if (status === 'draft') return 'Rascunho';
    if (status === 'published') return 'Publicado';
    if (status === 'checkin') return 'Check-in aberto';
    if (status === 'locked') return 'Bloqueado';
    if (status === 'running') return 'Em andamento';
    if (status === 'finished') return 'Finalizado';
    if (status === 'canceled') return 'Cancelado';
    return 'Status desconhecido';
  }

  private toDateTimeLabel(value: string | null): string {
    if (!value) return 'Não informado';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(parsed);
  }

  private readString(value: RawRecord | null, field: string): string | null {
    if (!value) return null;

    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private readInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isInteger(parsed)) return parsed;
    }

    return null;
  }

  private readRecord(value: unknown): RawRecord | null {
    return this.isRecord(value) ? value : null;
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
