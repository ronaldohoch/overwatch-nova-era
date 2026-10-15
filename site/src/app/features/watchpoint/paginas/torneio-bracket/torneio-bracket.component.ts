import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';
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
import { DrawTeam, TournamentTeamsService } from './tournament-teams.service';
import { ChaveManualComponent } from './chave-manual/chave-manual.component';
import {
  SorteioAoVivoComponent,
  SorteioTeam,
} from './sorteio-ao-vivo/sorteio-ao-vivo.component';

type PageState = 'loading' | 'no-bracket' | 'loaded' | 'error';
type RawRecord = Readonly<Record<string, unknown>>;

type ValidTeamCount = 4 | 8 | 16 | 32;
const VALID_TEAM_COUNTS: ReadonlySet<number> = new Set<number>([4, 8, 16, 32]);

@Component({
  selector: 'app-torneio-bracket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    CardComponent,
    ChaveManualComponent,
    DoubleEliminationComponent,
    FormsModule,
    InputComponent,
    RadioGroupComponent,
    RadioItemComponent,
    RouterLink,
    SelectComponent,
    SorteioAoVivoComponent,
    ToggleComponent,
  ],
  templateUrl: './torneio-bracket.component.html',
})
export class TorneioBracketComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly bracketsService = inject(BracketsService);
  private readonly seeding = inject(BracketSeedingService);
  private readonly tournamentTeams = inject(TournamentTeamsService);
  readonly auth = inject(AuthService);

  readonly tournamentId = this.readTournamentId();

  // ── Estado da página ──────────────────────────────────────

  readonly state = signal<PageState>('loading');
  readonly bracket = signal<Bracket | null>(null);
  readonly teams = signal<Record<string, TeamDisplay>>({});
  readonly tournamentName = signal<string | null>(null);
  readonly tournamentTeamMode = signal<string | null>(null);
  /** 'groups': a chave é o mata-mata gerado pela fase de grupos. */
  readonly tournamentFormat = signal<string | null>(null);
  readonly maxTeams = signal<ValidTeamCount | null>(null);
  readonly loadingSelectableTeams = signal(false);
  readonly selectableTeams = signal<readonly DrawTeam[]>([]);
  readonly selectableTeamsMessage = signal<string | null>(null);
  readonly pageError = signal<string | null>(null);

  // ── Formulário: criar chave ───────────────────────────────

  readonly seedMode = signal<'random' | 'manual'>('random');
  readonly creating = signal(false);
  readonly createMessage = signal<{ text: string; ok: boolean } | null>(null);

  /** Preview interativo do chaveamento (atualizado a cada seleção de time). */
  readonly seedPreview = signal<SeedPreview>(this.seeding.createEmpty(0));

  /** Palco de sorteio ao vivo (modo aleatório). */
  readonly sorteioOpen = signal(false);

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

  /** Chave com bye não reordena: os byes já foram aplicados nas partidas. */
  readonly canReorderSeeds = computed(() => {
    const b = this.bracket();
    if (!this.isAdmin() || b?.status !== 'running') return false;
    return Object.keys(b.seedMap).length === b.teamCount;
  });
  readonly editingSeeds = signal(false);
  readonly reorderingSeeds = signal(false);
  readonly reorderMessage = signal<{ text: string; ok: boolean } | null>(null);

  readonly bracketStatusLabel = computed(() => {
    const b = this.bracket();
    if (!b) return '';
    return b.status === 'finished' ? 'FINALIZADO' : 'EM ANDAMENTO';
  });

  readonly bracketStatusClass = computed(() => {
    const b = this.bracket();
    if (!b) return '';
    return b.status === 'finished'
      ? 'text-(--ow-green-text) font-extrabold'
      : 'text-(--ow-blue-text) font-extrabold';
  });

  readonly isRandomTournament = computed(() => this.tournamentTeamMode() === 'random');
  readonly isGroupsTournament = computed(() => this.tournamentFormat() === 'groups');

  /** Número de times já alocados no preview. */
  readonly selectedCount = computed(() => Object.keys(this.seedPreview().seedMap).length);

  /** Times do torneio que entram na chave (sorteio ou montagem manual). */
  readonly chaveTeams = computed<readonly SorteioTeam[]>(() =>
    this.selectableTeams().map((team) => ({
      id: team.id,
      name: team.name,
      logoUrl: team.logoUrl,
    })),
  );

  /** O sorteio ao vivo só faz sentido no modo aleatório com a chave completa. */
  readonly canOpenSorteio = computed(() => {
    if (this.seedMode() !== 'random') return false;
    if (this.creating()) return false;
    const n = this.maxTeams();
    return !!n && this.selectableTeams().length === n;
  });

  /** Pode gerar a chave? No manual, com todos os slots preenchidos. */
  readonly canGenerateBracket = computed(() => {
    if (this.creating()) return false;
    const n = this.maxTeams();
    return !!n && this.selectedCount() === n;
  });

  /** No modo aleatório o sorteio precisa do número exato de times. */
  readonly canSortear = computed(() => {
    if (this.creating()) return false;
    const n = this.maxTeams();
    return !!n && this.selectableTeams().length === n;
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

    // A chave é montada nos selects (manual) ou no sorteio (aleatório).
    const n = this.maxTeams();
    if (n) this.seedPreview.set(this.seeding.createEmpty(n));

    this.createMessage.set(null);
  }

  /** A chave montada manualmente vira o preview usado na geração. */
  onManualSeedMapChange(seedMap: Record<number, string>): void {
    this.applySeedMap(seedMap);
  }

  // ── Sorteio ao vivo ───────────────────────────────────────

  /** Sorteia as posições sem animação e já gera a chave. */
  async sortearAgora(): Promise<void> {
    if (!this.canSortear()) return;

    const n = this.maxTeams();
    if (!n) return;

    const teamIds = this.selectableTeams().map((team) => team.id);
    this.seedPreview.set(
      this.seeding.rebuildForMode(this.seeding.createEmpty(n), 'random', teamIds),
    );

    await this.createBracket();
  }

  openSorteio(): void {
    if (!this.canOpenSorteio()) return;
    this.createMessage.set(null);
    this.sorteioOpen.set(true);
  }

  closeSorteio(): void {
    this.sorteioOpen.set(false);
  }

  /** O sorteio terminou: o preview passa a refletir o resultado sorteado ao vivo. */
  onSorteioConcluded(seedMap: Record<number, string>): void {
    this.applySeedMap(seedMap);
  }

  /** Gera a chave direto do palco e fecha o overlay quando der certo. */
  async onSorteioGenerate(seedMap: Record<number, string>): Promise<void> {
    this.applySeedMap(seedMap);
    await this.createBracket();
    if (this.state() === 'loaded') this.sorteioOpen.set(false);
  }

  private applySeedMap(seedMap: Record<number, string>): void {
    const n = this.maxTeams();
    if (!n) return;

    const assigned = Object.keys(seedMap).map(Number);
    this.seedPreview.set({
      maxTeams: n,
      seedMap: { ...seedMap },
      availableSeeds: Array.from({ length: n }, (_, i) => i + 1).filter(
        (seed) => !assigned.includes(seed),
      ),
    });
  }

  async createBracket(): Promise<void> {
    if (!this.tournamentId || !this.canGenerateBracket()) return;

    this.createMessage.set(null);
    this.creating.set(true);

    try {
      const mode = this.seedMode();
      const n = this.maxTeams();
      const teamIds = this.seeding.getOrderedTeamIds(this.seedPreview());

      // Random ou manual, a ordem exibida na tela é a que vai para o backend.
      if (!n || teamIds.length !== n) {
        this.createMessage.set({
          text: `Defina exatamente ${n ?? 0} times na chave para gerar o chaveamento.`,
          ok: false,
        });
        this.creating.set(false);
        return;
      }

      const payload: { seedMode: 'random' | 'manual'; teamIds: string[] } = {
        seedMode: mode,
        teamIds,
      };

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
      this.seedMode.set('random');
      this.createMessage.set(null);
      this.sorteioOpen.set(false);
      this.state.set('no-bracket');
      const n = this.maxTeams();
      if (n) this.seedPreview.set(this.seeding.createEmpty(n));
      await this.loadDrawTeams();
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

  async onSeedSwapped(event: { seed1: number; seed2: number }): Promise<void> {
    if (!this.tournamentId || this.reorderingSeeds()) return;

    const currentBracket = this.bracket();
    if (!currentBracket) return;

    const currentSeedMap = { ...currentBracket.seedMap };
    const temp = currentSeedMap[event.seed1];
    currentSeedMap[event.seed1] = currentSeedMap[event.seed2];
    currentSeedMap[event.seed2] = temp;

    this.reorderingSeeds.set(true);
    this.reorderMessage.set(null);

    try {
      await this.bracketsService.updateSeeds(this.tournamentId, currentSeedMap);
      const updated = await this.bracketsService.getBracket(this.tournamentId);
      this.bracket.set(updated);
      await this.loadTeams(updated);
      this.reorderMessage.set({ text: 'Seeds atualizados com sucesso.', ok: true });
    } catch (error: unknown) {
      this.reorderMessage.set({
        text: this.resolveError(error, 'Não foi possível reordenar os seeds.'),
        ok: false,
      });
    } finally {
      this.reorderingSeeds.set(false);
    }
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
        await this.loadDrawTeams();
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
        this.tournamentFormat.set(this.readString(response, 'format'));

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

  /** Times do sorteio. Torneio com grupos não monta a chave aqui. */
  private async loadDrawTeams(): Promise<void> {
    if (!this.tournamentId || this.isGroupsTournament()) {
      this.selectableTeams.set([]);
      this.selectableTeamsMessage.set(null);
      return;
    }

    this.loadingSelectableTeams.set(true);
    this.selectableTeamsMessage.set(null);
    const n = this.maxTeams();
    if (n) this.seedPreview.set(this.seeding.createEmpty(n));

    const result = await this.tournamentTeams.loadForDraw(this.tournamentId, this.tournamentTeamMode());
    this.selectableTeams.set(result.teams);
    this.selectableTeamsMessage.set(result.message);
    this.loadingSelectableTeams.set(false);
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
