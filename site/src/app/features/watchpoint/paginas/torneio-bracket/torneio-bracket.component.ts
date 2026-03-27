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
import { ToggleComponent } from '../../../../shared/design-system/toggle/toggle.component';
import { InputComponent } from '../../../../shared/design-system/input/input.component';
import {
  RadioGroupComponent,
  RadioItemComponent,
} from '../../../../shared/design-system/radio/radio.component';
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
import { BracketSeedingService, SeedPreview } from './bracket-seeding.service';

type PageState = 'loading' | 'no-bracket' | 'loaded' | 'error';
type RawRecord = Readonly<Record<string, unknown>>;
type TeamCategory = 'formed' | 'random' | 'unknown';
type SelectableTeam = Readonly<{
  id: string;
  name: string;
  logoUrl: string | null;
  category: TeamCategory;
  tournamentIds: readonly string[];
}>;

type ValidTeamCount = 4 | 8 | 16 | 32;
const VALID_TEAM_COUNTS: ReadonlySet<number> = new Set<number>([4, 8, 16, 32]);

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
    RadioGroupComponent,
    RadioItemComponent,
    RouterLink,
    SelectComponent,
    ToggleComponent,
  ],
  templateUrl: './torneio-bracket.component.html',
})
export class TorneioBracketComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly bracketsService = inject(BracketsService);
  private readonly seeding = inject(BracketSeedingService);
  readonly auth = inject(AuthService);

  readonly tournamentId = this.readTournamentId();

  // ── Estado da página ──────────────────────────────────────

  readonly state = signal<PageState>('loading');
  readonly bracket = signal<Bracket | null>(null);
  readonly teams = signal<Record<string, TeamDisplay>>({});
  readonly tournamentName = signal<string | null>(null);
  readonly tournamentTeamMode = signal<string | null>(null);
  readonly maxTeams = signal<ValidTeamCount | null>(null);
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

  /** Preview interativo do chaveamento (atualizado a cada seleção de time). */
  readonly seedPreview = signal<SeedPreview>(this.seeding.createEmpty(0));

  // ── Formulário: registrar resultado ───────────────────────

  readonly reportingMatchNumber = signal<number | null>(null);
  readonly reportWinnerId = signal('');
  readonly reportScore1 = signal('');
  readonly reportScore2 = signal('');
  readonly reportIsWalkover = signal(false);
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

  /** Número de times já alocados no preview. */
  readonly selectedCount = computed(() => Object.keys(this.seedPreview().seedMap).length);

  /** Pares de seeds para visualização dos confrontos WB R1 no preview. */
  readonly wbR1Pairs = computed<readonly { matchNumber: number; seed1: number; seed2: number }[]>(
    () => {
      const n = this.maxTeams();
      if (!n) return [];
      return Array.from({ length: n / 2 }, (_, i) => ({
        matchNumber: i + 1,
        seed1: i * 2 + 1,
        seed2: i * 2 + 2,
      }));
    },
  );

  /** Pode gerar a chave? */
  readonly canGenerateBracket = computed(() => {
    if (this.creating()) return false;
    if (this.isRandomTournament()) {
      const n = this.maxTeams();
      return !!n && this.selectedCount() === n;
    }
    if (this.seedMode() === 'manual') {
      return this.parseTeamIds(this.teamIdsInput()).length >= 4;
    }
    return true;
  });

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
    const newMode = value === 'manual' ? 'manual' : 'random';
    this.seedMode.set(newMode);

    // Reconstrói o preview mantendo os times selecionados, mas re-distribuindo
    const n = this.maxTeams();
    if (n && this.isRandomTournament()) {
      const selected = [...this.selectedRandomTeamIds()];
      this.seedPreview.set(this.seeding.rebuildForMode(this.seeding.createEmpty(n), newMode, selected));
    }

    this.createMessage.set(null);
  }

  onTeamIdsInputChange(value: string): void {
    this.teamIdsInput.set(value);
  }

  onSelectableTeamChange(teamId: string, checked: boolean): void {
    const normalizedTeamId = teamId.trim();
    if (!normalizedTeamId) return;

    if (checked) {
      this.selectedRandomTeamIds.update((current) => {
        if (current.includes(normalizedTeamId)) return current;
        return [...current, normalizedTeamId];
      });

      // Atualiza o preview conforme o modo atual
      const mode = this.seedMode();
      this.seedPreview.update((p) =>
        mode === 'random'
          ? this.seeding.assignRandom(p, normalizedTeamId)
          : this.seeding.assignManual(p, normalizedTeamId),
      );
    } else {
      this.selectedRandomTeamIds.update((current) => current.filter((id) => id !== normalizedTeamId));
      this.seedPreview.update((p) => this.seeding.removeTeam(p, normalizedTeamId));
    }

    this.createMessage.set(null);
  }

  isSelectableTeamChecked(teamId: string): boolean {
    return this.selectedRandomTeamIds().includes(teamId);
  }

  /** Logo do time selecionável (para a lista e para o preview). */
  selectableTeamLogo(teamId: string): string | null {
    return this.selectableTeams().find((t) => t.id === teamId)?.logoUrl ?? null;
  }

  /** Iniciais (2 chars) de um nome de time — fallback quando não há logo. */
  teamInitials(name: string): string {
    return name.trim().substring(0, 2).toUpperCase();
  }

  /** Nome do time para exibição no preview do seed. */
  previewTeamName(seedNumber: number): string {
    const teamId = this.seedPreview().seedMap[seedNumber];
    if (!teamId) return `Seed ${seedNumber}`;
    return this.selectableTeams().find((t) => t.id === teamId)?.name ?? `Seed ${seedNumber}`;
  }

  /** O slot do seed está preenchido? */
  previewSlotFilled(seedNumber: number): boolean {
    return !!this.seedPreview().seedMap[seedNumber];
  }

  async createBracket(): Promise<void> {
    if (!this.tournamentId || !this.canGenerateBracket()) return;

    this.createMessage.set(null);
    this.creating.set(true);

    try {
      const mode = this.seedMode();
      let payload: { seedMode: 'random' | 'manual'; teamIds?: string[] };

      if (this.isRandomTournament()) {
        // Para torneios random, envia a ordem do preview (já sorteada ou manual)
        const teamIds = this.seeding.getOrderedTeamIds(this.seedPreview());
        const n = this.maxTeams();

        if (!n || teamIds.length !== n) {
          this.createMessage.set({
            text: `Selecione exatamente ${n ?? 0} times para gerar a chave.`,
            ok: false,
          });
          this.creating.set(false);
          return;
        }

        payload = { seedMode: mode, teamIds };
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

      // createBracket retorna apenas o documento do bracket sem as partidas;
      // busca o bracket completo (com matches) antes de renderizar.
      await this.bracketsService.createBracket(this.tournamentId, payload);
      const bracket = await this.bracketsService.getBracket(this.tournamentId);
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
        const n = this.maxTeams();
        if (n) this.seedPreview.set(this.seeding.createEmpty(n));
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
    this.reportIsWalkover.set(false);
    this.reportMessage.set(null);
  }

  onMatchReportRequested(match: BracketMatch): void {
    this.openReportForm(match);
  }

  closeReportForm(): void {
    this.reportingMatchNumber.set(null);
    this.reportIsWalkover.set(false);
    this.reportMessage.set(null);
  }

  onReportWalkoverChange(value: boolean): void {
    this.reportIsWalkover.set(value);
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
      const isWalkover = this.reportIsWalkover();
      const payload: ReportMatchPayload = {
        winnerId: this.reportWinnerId().trim(),
        ...(isWalkover ? { walkover: true } : {
          ...this.parseOptionalScore('team1Score', this.reportScore1()),
          ...this.parseOptionalScore('team2Score', this.reportScore2()),
        }),
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

        // Lê maxTeams para montar o preview da chave
        const raw = response['maxTeams'];
        const maxTeamsValue = typeof raw === 'number' ? raw : null;
        if (maxTeamsValue && VALID_TEAM_COUNTS.has(maxTeamsValue)) {
          const n = maxTeamsValue as ValidTeamCount;
          this.maxTeams.set(n);
          this.seedPreview.set(this.seeding.createEmpty(n));
        }
      }
    } catch {
      // nome/maxTeams opcionais — não falha a página
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
    // Reseta preview ao recarregar times
    const n = this.maxTeams();
    if (n) this.seedPreview.set(this.seeding.createEmpty(n));

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

    const logoUrl =
      this.readString(value, 'logoUrl') ?? this.readString(value, 'logo_url');

    return {
      id,
      name,
      logoUrl,
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
