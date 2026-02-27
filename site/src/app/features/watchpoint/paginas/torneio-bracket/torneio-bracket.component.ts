import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';
import { CheckboxComponent } from '../../../../shared/design-system/checkbox/checkbox.component';
import { InputComponent } from '../../../../shared/design-system/input/input.component';
import {
  OwSelectOption,
  SelectComponent,
} from '../../../../shared/design-system/select/select.component';
import { DoubleEliminationComponent } from '../../../torneio/brackets/double-elimination/double-elimination.component';
import {
  Bracket,
  BracketMatch,
  BracketsService,
  ReportMatchPayload,
} from '../../../torneio/brackets/brackets.service';
import { TeamDisplay } from '../../../torneio/components/match-card/match-card.component';

type PageState = 'loading' | 'no-bracket' | 'loaded' | 'error';
type RawRecord = Readonly<Record<string, unknown>>;
type TeamCategory = 'formed' | 'random' | 'unknown';
type SelectableTeam = Readonly<{
  id: string;
  name: string;
  category: TeamCategory;
  tournamentIds: readonly string[];
}>;

@Component({
  selector: 'app-torneio-bracket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    CardComponent,
    CheckboxComponent,
    DoubleEliminationComponent,
    FormsModule,
    InputComponent,
    RouterLink,
    SelectComponent,
  ],
  templateUrl: './torneio-bracket.component.html',
})
export class TorneioBracketComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly bracketsService = inject(BracketsService);
  readonly auth = inject(AuthService);

  readonly tournamentId = this.readTournamentId();

  // ── Estado da página ──────────────────────────────────────

  readonly state = signal<PageState>('loading');
  readonly bracket = signal<Bracket | null>(null);
  readonly teams = signal<Record<string, TeamDisplay>>({});
  readonly tournamentName = signal<string | null>(null);
  readonly tournamentTeamMode = signal<string | null>(null);
  readonly loadingSelectableTeams = signal(false);
  readonly selectableTeams = signal<readonly SelectableTeam[]>([]);
  readonly selectedRandomTeamIds = signal<readonly string[]>([]);
  readonly selectableTeamsMessage = signal<string | null>(null);
  readonly pageError = signal<string | null>(null);

  // ── Formulário: criar chave ───────────────────────────────

  readonly seedMode = signal<'random' | 'manual'>('random');
  readonly teamIdsInput = signal('');
  readonly creating = signal(false);
  readonly createMessage = signal<{ text: string; ok: boolean } | null>(null);

  // ── Formulário: registrar resultado ───────────────────────

  readonly reportingMatchNumber = signal<number | null>(null);
  readonly reportWinnerId = signal('');
  readonly reportScore1 = signal('');
  readonly reportScore2 = signal('');
  readonly reportSubmitting = signal(false);
  readonly reportMessage = signal<{ text: string; ok: boolean } | null>(null);

  // ── Computed ──────────────────────────────────────────────

  readonly isAdmin = computed(() => this.auth.userRole() === 'admin');
  readonly isAdminOrStreamer = computed(() => {
    const role = this.auth.userRole();
    return role === 'admin' || role === 'streamer';
  });

  readonly activeReportMatch = computed<BracketMatch | null>(() => {
    const num = this.reportingMatchNumber();
    if (num === null) return null;
    return this.bracket()?.matches.find((m) => m.matchNumber === num) ?? null;
  });

  readonly reportWinnerOptions = computed<OwSelectOption[]>(() => {
    const match = this.activeReportMatch();
    if (!match) return [];

    const options: OwSelectOption[] = [];
    if (match.team1Id) {
      options.push({ value: match.team1Id, label: this.teamName(match.team1Id) });
    }
    if (match.team2Id) {
      options.push({ value: match.team2Id, label: this.teamName(match.team2Id) });
    }
    return options;
  });

  readonly canReport = computed(() => {
    if (!this.isAdminOrStreamer()) return false;
    if (this.reportSubmitting()) return false;
    const winnerId = this.reportWinnerId().trim();
    if (!winnerId) return false;
    const match = this.activeReportMatch();
    if (!match) return false;
    return winnerId === match.team1Id || winnerId === match.team2Id;
  });

  readonly bracketStatusLabel = computed(() => {
    const b = this.bracket();
    if (!b) return '';
    return b.status === 'finished' ? 'FINALIZADO' : 'EM ANDAMENTO';
  });

  readonly bracketStatusClass = computed(() => {
    const b = this.bracket();
    if (!b) return '';
    return b.status === 'finished'
      ? 'text-(--ow-green) font-extrabold'
      : 'text-(--ow-blue) font-extrabold';
  });
  readonly isRandomTournament = computed(() => this.tournamentTeamMode() === 'random');
  readonly selectedRandomTeamsCount = computed(() => this.selectedRandomTeamIds().length);
  readonly hasMinimumSelectedRandomTeams = computed(() => this.selectedRandomTeamsCount() >= 4);

  constructor() {
    if (this.tournamentId) {
      void this.loadPage(this.tournamentId);
    } else {
      this.pageError.set('ID do torneio não informado. Acesse esta tela pela listagem de torneios.');
      this.state.set('error');
    }
  }

  // ── Ações ─────────────────────────────────────────────────

  onSeedModeChange(value: string): void {
    this.seedMode.set(value === 'manual' ? 'manual' : 'random');
    if (!this.isRandomTournament()) {
      this.teamIdsInput.set('');
    }
    this.createMessage.set(null);
  }

  onTeamIdsInputChange(value: string): void {
    this.teamIdsInput.set(value);
  }

  onSelectableTeamChange(teamId: string, checked: boolean): void {
    const normalizedTeamId = teamId.trim();
    if (!normalizedTeamId) return;

    this.selectedRandomTeamIds.update((current) => {
      if (checked) {
        if (current.includes(normalizedTeamId)) return current;
        return [...current, normalizedTeamId];
      }
      return current.filter((id) => id !== normalizedTeamId);
    });
    this.createMessage.set(null);
  }

  isSelectableTeamChecked(teamId: string): boolean {
    return this.selectedRandomTeamIds().includes(teamId);
  }

  selectableTeamLabel(teamId: string): string {
    const team = this.selectableTeams().find((item) => item.id === teamId);
    if (!team) return 'Time indisponível';
    return team.name;
  }

  async createBracket(): Promise<void> {
    if (!this.tournamentId || this.creating()) return;

    this.createMessage.set(null);
    this.creating.set(true);

    try {
      const mode = this.seedMode();
      let payload: { seedMode: 'random' | 'manual'; teamIds?: string[] };

      if (this.isRandomTournament()) {
        const selectedTeamIds = this.selectedRandomTeamIds();
        if (selectedTeamIds.length < 4) {
          this.createMessage.set({
            text: 'Selecione ao menos 4 times para gerar a chave.',
            ok: false,
          });
          this.creating.set(false);
          return;
        }

        payload = { seedMode: mode, teamIds: [...selectedTeamIds] };
      } else if (mode === 'manual') {
        const teamIds = this.parseTeamIds(this.teamIdsInput());
        if (teamIds.length < 4) {
          this.createMessage.set({
            text: 'Informe ao menos 4 IDs de times para o seeding manual.',
            ok: false,
          });
          this.creating.set(false);
          return;
        }
        payload = { seedMode: 'manual', teamIds };
      } else {
        payload = { seedMode: 'random' };
      }

      const bracket = await this.bracketsService.createBracket(this.tournamentId, payload);
      this.bracket.set(bracket);
      await this.loadTeams(bracket);
      this.state.set('loaded');
      this.createMessage.set(null);
    } catch (error: unknown) {
      this.createMessage.set({
        text: this.resolveError(error, 'Não foi possível criar a chave.'),
        ok: false,
      });
    } finally {
      this.creating.set(false);
    }
  }

  async deleteBracket(): Promise<void> {
    if (!this.tournamentId || !this.isAdmin()) return;

    const confirmed = confirm('Tem certeza que deseja excluir a chave? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await this.bracketsService.deleteBracket(this.tournamentId);
      this.bracket.set(null);
      this.teams.set({});
      this.teamIdsInput.set('');
      this.seedMode.set('random');
      this.selectedRandomTeamIds.set([]);
      this.createMessage.set(null);
      this.state.set('no-bracket');
      if (this.isRandomTournament()) {
        await this.loadSelectableTeams();
      }
    } catch (error: unknown) {
      alert(this.resolveError(error, 'Não foi possível excluir a chave.'));
    }
  }

  openReportForm(match: BracketMatch): void {
    if (!this.isAdminOrStreamer()) return;
    if (!(match.status === 'ready' || match.status === 'running')) return;

    this.reportingMatchNumber.set(match.matchNumber);
    this.reportWinnerId.set('');
    this.reportScore1.set('');
    this.reportScore2.set('');
    this.reportMessage.set(null);
  }

  onMatchReportRequested(match: BracketMatch): void {
    this.openReportForm(match);
  }

  closeReportForm(): void {
    this.reportingMatchNumber.set(null);
    this.reportMessage.set(null);
  }

  onReportWinnerChange(value: string): void {
    this.reportWinnerId.set(value);
  }

  onReportScore1Change(value: string): void {
    this.reportScore1.set(value);
  }

  onReportScore2Change(value: string): void {
    this.reportScore2.set(value);
  }

  async submitReport(): Promise<void> {
    if (!this.tournamentId || !this.canReport()) return;

    const matchNumber = this.reportingMatchNumber();
    if (matchNumber === null) return;

    this.reportSubmitting.set(true);
    this.reportMessage.set(null);

    try {
      const payload: ReportMatchPayload = {
        winnerId: this.reportWinnerId().trim(),
        ...this.parseOptionalScore('team1Score', this.reportScore1()),
        ...this.parseOptionalScore('team2Score', this.reportScore2()),
      };

      await this.bracketsService.reportMatchResult(this.tournamentId, matchNumber, payload);

      // Recarrega o bracket atualizado
      const updated = await this.bracketsService.getBracket(this.tournamentId);
      this.bracket.set(updated);

      this.reportMessage.set({ text: 'Resultado registrado com sucesso.', ok: true });
      this.reportingMatchNumber.set(null);
    } catch (error: unknown) {
      this.reportMessage.set({
        text: this.resolveError(error, 'Não foi possível registrar o resultado.'),
        ok: false,
      });
    } finally {
      this.reportSubmitting.set(false);
    }
  }

  // ── Helpers para template ─────────────────────────────────

  teamName(teamId: string | null): string {
    if (!teamId) return 'Time a definir';
    return this.teams()[teamId]?.name ?? 'Time sem nome';
  }

  // ── Privados ──────────────────────────────────────────────

  private async loadPage(tournamentId: string): Promise<void> {
    this.state.set('loading');
    await this.loadTournamentInfo(tournamentId);

    try {
      const bracket = await this.bracketsService.getBracket(tournamentId);
      this.bracket.set(bracket);
      await this.loadTeams(bracket);
      this.state.set('loaded');
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set('no-bracket');
        if (this.isRandomTournament()) {
          await this.loadSelectableTeams();
        }
      } else {
        this.pageError.set(this.resolveError(error, 'Não foi possível carregar a chave.'));
        this.state.set('error');
      }
    }
  }

  private async loadTournamentInfo(tournamentId: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${environment.apiURLTorneios}/${tournamentId}`),
      );
      if (this.isRecord(response)) {
        const name = this.readString(response, 'name');
        const teamMode = (this.readString(response, 'teamMode') ?? '').toLowerCase();
        this.tournamentName.set(name);
        this.tournamentTeamMode.set(teamMode || null);
      }
    } catch {
      // nome opcional — não falha a página
    }
  }

  private async loadSelectableTeams(): Promise<void> {
    if (!this.tournamentId || !this.isRandomTournament()) {
      this.selectableTeams.set([]);
      this.selectedRandomTeamIds.set([]);
      this.selectableTeamsMessage.set(null);
      return;
    }

    this.loadingSelectableTeams.set(true);
    this.selectableTeamsMessage.set(null);
    this.selectedRandomTeamIds.set([]);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(environment.apiURLTimes));
      const allTeams = this.extractArray(response).map((raw) => this.toSelectableTeam(raw));
      const randomTeams = allTeams.filter((team) => team.category === 'random' && !!team.id);
      const uniqueRandomTeams = [...new Map(randomTeams.map((team) => [team.id, team])).values()];
      const teamsForTournament = uniqueRandomTeams.filter((team) =>
        team.tournamentIds.includes(this.tournamentId!),
      );
      const scopedList = teamsForTournament.length > 0 ? teamsForTournament : uniqueRandomTeams;
      const sorted = scopedList.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      this.selectableTeams.set(sorted);
      if (sorted.length === 0) {
        this.selectableTeamsMessage.set('Nenhum time random disponível para seleção.');
      }
    } catch (error: unknown) {
      this.selectableTeams.set([]);
      this.selectableTeamsMessage.set(
        this.resolveError(error, 'Não foi possível carregar os times para seleção.'),
      );
    } finally {
      this.loadingSelectableTeams.set(false);
    }
  }

  private async loadTeams(bracket: Bracket): Promise<void> {
    const seedIds = Object.values(bracket.seedMap).filter(Boolean);
    if (seedIds.length === 0) return;

    try {
      const response = await firstValueFrom(this.http.get<unknown>(environment.apiURLTimes));
      const rawTeams = this.extractArray(response);
      const map: Record<string, TeamDisplay> = {};

      for (const raw of rawTeams) {
        const id =
          this.readString(raw, 'id') ??
          this.readString(raw, '_id') ??
          this.readString(raw, 'teamId');
        const name =
          this.readString(raw, 'name') ??
          this.readString(raw, 'teamName') ??
          this.readString(raw, 'title');
        const logoUrl =
          this.readString(raw, 'logoUrl') ?? this.readString(raw, 'logo_url');

        if (id && name && seedIds.includes(id)) {
          map[id] = { id, name, logoUrl };
        }
      }

      this.teams.set(map);
    } catch {
      // times sem nome → mostrará "??" no card
    }
  }

  private readTournamentId(): string | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim();
    return normalized || null;
  }

  private parseTeamIds(raw: string): string[] {
    return raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private toSelectableTeam(value: RawRecord): SelectableTeam {
    const id =
      this.readString(value, 'id') ??
      this.readString(value, '_id') ??
      this.readString(value, 'teamId') ??
      '';
    const name =
      this.readString(value, 'name') ??
      this.readString(value, 'teamName') ??
      this.readString(value, 'title') ??
      'Time sem nome';

    return {
      id,
      name,
      category: this.readTeamCategory(value),
      tournamentIds: this.readTeamTournamentIds(value),
    };
  }

  private readTeamCategory(value: RawRecord): TeamCategory {
    const raw = (
      this.readString(value, 'category') ??
      this.readString(value, 'teamCategory') ??
      ''
    ).toLowerCase();
    if (raw === 'formed') return 'formed';
    if (raw === 'random') return 'random';
    return 'unknown';
  }

  private readTeamTournamentIds(value: RawRecord): readonly string[] {
    const tournamentIds = new Set<string>();

    for (const field of ['tournamentId', 'currentTournamentId']) {
      const id = this.readString(value, field);
      if (id) tournamentIds.add(id);
    }

    for (const field of ['tournamentIds', 'registeredTournamentIds']) {
      const list = value[field];
      if (!Array.isArray(list)) continue;

      for (const item of list) {
        if (typeof item !== 'string') continue;
        const normalized = item.trim();
        if (normalized) tournamentIds.add(normalized);
      }
    }

    const tournaments = value['tournaments'];
    if (Array.isArray(tournaments)) {
      for (const item of tournaments) {
        if (!this.isRecord(item)) continue;
        const id = this.readString(item, 'id') ?? this.readString(item, 'tournamentId');
        if (id) tournamentIds.add(id);
      }
    }

    return [...tournamentIds];
  }

  private parseOptionalScore(
    key: 'team1Score' | 'team2Score',
    raw: string,
  ): Partial<ReportMatchPayload> {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(parsed) || parsed < 0) return {};
    return { [key]: parsed };
  }

  private extractArray(value: unknown): RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }
    if (this.isRecord(value)) {
      for (const key of ['teams', 'data', 'items', 'results', 'payload']) {
        const nested = value[key];
        if (Array.isArray(nested)) {
          return nested.filter((item): item is RawRecord => this.isRecord(item));
        }
      }
    }
    return [];
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim();
    return normalized || null;
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
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallbackMessage;
  }
}
