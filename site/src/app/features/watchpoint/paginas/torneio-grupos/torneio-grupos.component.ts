import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';
import { InputComponent } from '../../../../shared/design-system/input/input.component';
import {
  RadioGroupComponent,
  RadioItemComponent,
} from '../../../../shared/design-system/radio/radio.component';
import {
  OwSelectOption,
  SelectComponent,
} from '../../../../shared/design-system/select/select.component';
import { ToggleComponent } from '../../../../shared/design-system/toggle/toggle.component';
import { FaseDeGruposComponent } from '../../../torneio/grupos/fase-de-grupos/fase-de-grupos.component';
import {
  GroupMatch,
  GroupStage,
  GruposService,
  QUALIFIED_PER_GROUP,
  ReportGroupMatchPayload,
  groupLetter,
  groupSizes,
} from '../../../torneio/grupos/grupos.service';
import {
  SorteioAoVivoComponent,
  SorteioBox,
} from '../torneio-bracket/sorteio-ao-vivo/sorteio-ao-vivo.component';
import { DrawTeam, TournamentTeamsService } from '../torneio-bracket/tournament-teams.service';
import { GruposManualComponent } from './grupos-manual/grupos-manual.component';

type PageState = 'loading' | 'no-stage' | 'loaded' | 'error';
type RawRecord = Readonly<Record<string, unknown>>;
type Message = { text: string; ok: boolean };

const KNOCKOUT_LABELS: Record<string, string> = {
  double_elimination: 'Dupla eliminação',
  single_elimination: 'Eliminação simples',
};

@Component({
  selector: 'app-torneio-grupos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    CardComponent,
    FaseDeGruposComponent,
    FormsModule,
    GruposManualComponent,
    InputComponent,
    RadioGroupComponent,
    RadioItemComponent,
    RouterLink,
    SelectComponent,
    SorteioAoVivoComponent,
    ToggleComponent,
  ],
  templateUrl: './torneio-grupos.component.html',
})
export class TorneioGruposComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly grupos = inject(GruposService);
  private readonly tournamentTeams = inject(TournamentTeamsService);
  readonly auth = inject(AuthService);

  readonly tournamentId = this.route.snapshot.paramMap.get('id')?.trim() || null;

  // ── Estado da página ──────────────────────────────────────

  readonly state = signal<PageState>('loading');
  readonly stage = signal<GroupStage | null>(null);
  readonly pageError = signal<string | null>(null);
  readonly pageMessage = signal<Message | null>(null);

  readonly tournamentName = signal<string | null>(null);
  readonly tournamentStatus = signal<string | null>(null);
  readonly tournamentFormat = signal<string | null>(null);
  readonly teamMode = signal<string | null>(null);
  readonly knockoutFormat = signal<string | null>(null);
  readonly maxTeams = signal<number | null>(null);

  // ── Geração dos grupos ────────────────────────────────────

  readonly drawTeams = signal<readonly DrawTeam[]>([]);
  readonly drawTeamsMessage = signal<string | null>(null);
  readonly loadingTeams = signal(false);
  readonly drawMode = signal<'random' | 'manual'>('random');
  readonly manualGroups = signal<string[][] | null>(null);
  readonly creating = signal(false);
  readonly createMessage = signal<Message | null>(null);
  readonly sorteioOpen = signal(false);

  // ── Resultado de partida ──────────────────────────────────

  readonly reportingMatch = signal<GroupMatch | null>(null);
  readonly reportScore1 = signal('');
  readonly reportScore2 = signal('');
  readonly reportWalkover = signal(false);
  readonly reportWinnerId = signal('');
  readonly reportSubmitting = signal(false);
  readonly reportError = signal<string | null>(null);

  // ── Desempate manual e mata-mata ──────────────────────────

  /** Ordem em edição dos grupos com empate em aberto. */
  readonly tieOrders = signal<Record<string, string[]>>({});
  readonly savingOrder = signal<string | null>(null);
  readonly generatingKnockout = signal(false);

  // ── Computed ──────────────────────────────────────────────

  readonly isAdmin = computed(() => this.auth.userRole() === 'admin');
  readonly isAdminOrStreamer = computed(() => {
    const role = this.auth.userRole();
    return role === 'admin' || role === 'streamer';
  });

  readonly isGroupsTournament = computed(() => this.tournamentFormat() === 'groups');
  readonly isRunning = computed(() => this.tournamentStatus() === 'running');
  readonly knockoutLabel = computed(() => KNOCKOUT_LABELS[this.knockoutFormat() ?? ''] ?? 'Mata-mata');

  readonly plannedSizes = computed(() => groupSizes(this.drawTeams().length));

  /** Motivo que impede gerar os grupos (null = pode gerar). */
  readonly drawBlocker = computed<string | null>(() => {
    if (!this.isRunning()) return 'Os grupos só podem ser gerados com o torneio em andamento.';
    const n = this.drawTeams().length;
    if (n < 6) return `A fase de grupos precisa de pelo menos 6 times (há ${n}).`;
    const max = this.maxTeams();
    if (max && n > max) return `O torneio aceita no máximo ${max} times (há ${n}).`;
    return null;
  });

  readonly canCreate = computed(() => {
    if (this.creating() || this.drawBlocker()) return false;
    return this.drawMode() === 'random' || !!this.manualGroups();
  });

  /** Caixas do sorteio ao vivo: um grupo por caixa, vagas A1, A2... */
  readonly sorteioBoxes = computed<SorteioBox[]>(() => {
    let seed = 1;
    return this.plannedSizes().map((size, g) => {
      const letter = groupLetter(g);
      return {
        key: letter,
        title: `Grupo ${letter}`,
        slots: Array.from({ length: size }, (_, i) => ({ seed: seed++, label: `${letter}${i + 1}` })),
      };
    });
  });

  readonly finishedCount = computed(
    () => this.stage()?.matches.filter((m) => m.status === 'finished').length ?? 0,
  );

  /** Ex.: "6 classificados · chave de 8 com 2 byes". */
  readonly knockoutSummary = computed(() => {
    const groupCount = this.stage()?.groupCount ?? this.plannedSizes().length;
    if (!groupCount) return null;
    const qualified = groupCount * QUALIFIED_PER_GROUP;
    let size = 4;
    while (size < qualified) size *= 2;
    const byes = size - qualified;
    const byeText = byes === 0 ? 'sem byes' : byes === 1 ? 'com 1 bye' : `com ${byes} byes`;
    return `${qualified} classificados · chave de ${size} ${byeText}`;
  });

  readonly canGenerateKnockout = computed(() => {
    const s = this.stage();
    if (!s || !this.isAdmin() || this.generatingKnockout()) return false;
    return s.allMatchesFinished && s.blockingTieGroups.length === 0 && !s.knockoutGenerated;
  });

  readonly reportWinnerOptions = computed<OwSelectOption[]>(() => {
    const match = this.reportingMatch();
    if (!match) return [];
    return [
      { value: match.team1Id, label: this.teamName(match.team1Id) },
      { value: match.team2Id, label: this.teamName(match.team2Id) },
    ];
  });

  constructor() {
    if (this.tournamentId) {
      void this.loadPage(this.tournamentId);
    } else {
      this.pageError.set('ID do torneio não informado. Acesse esta tela pela listagem de torneios.');
      this.state.set('error');
    }
  }

  // ── Geração dos grupos ────────────────────────────────────

  onDrawModeChange(value: string): void {
    this.drawMode.set(value === 'manual' ? 'manual' : 'random');
    this.manualGroups.set(null);
    this.createMessage.set(null);
  }

  /** Sorteia sem animação e já gera os grupos. */
  async sortearAgora(): Promise<void> {
    if (!this.canCreate()) return;
    const shuffled = this.shuffle(this.drawTeams().map((t) => t.id));
    let cursor = 0;
    const groups = this.plannedSizes().map((size) => shuffled.slice(cursor, (cursor += size)));
    await this.createGroups(groups);
  }

  openSorteio(): void {
    if (!this.canCreate()) return;
    this.createMessage.set(null);
    this.sorteioOpen.set(true);
  }

  async onSorteioGenerate(seedMap: Record<number, string>): Promise<void> {
    const groups = this.sorteioBoxes().map((box) => box.slots.map((slot) => seedMap[slot.seed]));
    await this.createGroups(groups);
    if (this.state() === 'loaded') this.sorteioOpen.set(false);
  }

  async createManual(): Promise<void> {
    const groups = this.manualGroups();
    if (!groups || !this.canCreate()) return;
    await this.createGroups(groups);
  }

  async deleteStage(): Promise<void> {
    if (!this.tournamentId || !this.isAdmin()) return;
    const confirmed = confirm('Excluir a fase de grupos apaga grupos e resultados. Continuar?');
    if (!confirmed) return;

    try {
      await this.grupos.deleteGroupStage(this.tournamentId);
      this.stage.set(null);
      this.manualGroups.set(null);
      this.pageMessage.set(null);
      this.state.set('no-stage');
      await this.loadDrawTeams();
    } catch (error: unknown) {
      this.pageMessage.set({ text: this.resolveError(error, 'Não foi possível excluir os grupos.'), ok: false });
    }
  }

  // ── Resultado de partida ──────────────────────────────────

  openReport(match: GroupMatch): void {
    if (!this.isAdminOrStreamer()) return;
    this.reportingMatch.set(match);
    this.reportScore1.set(match.team1Score === null ? '' : String(match.team1Score));
    this.reportScore2.set(match.team2Score === null ? '' : String(match.team2Score));
    this.reportWalkover.set(match.walkover);
    this.reportWinnerId.set(match.walkover ? (match.winnerId ?? '') : '');
    this.reportError.set(null);
  }

  closeReport(): void {
    this.reportingMatch.set(null);
    this.reportError.set(null);
  }

  async submitReport(): Promise<void> {
    const match = this.reportingMatch();
    if (!this.tournamentId || !match || this.reportSubmitting()) return;

    const payload = this.buildReportPayload();
    if (typeof payload === 'string') {
      this.reportError.set(payload);
      return;
    }

    this.reportSubmitting.set(true);
    this.reportError.set(null);
    try {
      await this.grupos.reportMatchResult(this.tournamentId, match.matchNumber, payload);
      await this.reloadStage();
      this.reportingMatch.set(null);
      this.pageMessage.set({ text: `Resultado do jogo ${match.matchNumber} salvo.`, ok: true });
    } catch (error: unknown) {
      this.reportError.set(this.resolveError(error, 'Não foi possível registrar o resultado.'));
    } finally {
      this.reportSubmitting.set(false);
    }
  }

  // ── Desempate manual ──────────────────────────────────────

  moveInTie(letter: string, index: number, direction: -1 | 1): void {
    this.tieOrders.update((orders) => {
      const order = [...(orders[letter] ?? [])];
      const target = index + direction;
      if (target < 0 || target >= order.length) return orders;
      [order[index], order[target]] = [order[target], order[index]];
      return { ...orders, [letter]: order };
    });
  }

  async saveTieOrder(letter: string): Promise<void> {
    const order = this.tieOrders()[letter];
    if (!this.tournamentId || !order) return;

    this.savingOrder.set(letter);
    try {
      await this.grupos.setManualOrder(this.tournamentId, letter, order);
      await this.reloadStage();
      this.pageMessage.set({ text: `Ordem do grupo ${letter} definida.`, ok: true });
    } catch (error: unknown) {
      this.pageMessage.set({ text: this.resolveError(error, 'Não foi possível salvar a ordem.'), ok: false });
    } finally {
      this.savingOrder.set(null);
    }
  }

  // ── Mata-mata ─────────────────────────────────────────────

  async generateKnockout(): Promise<void> {
    if (!this.tournamentId || !this.canGenerateKnockout()) return;

    this.generatingKnockout.set(true);
    try {
      await this.grupos.generateKnockout(this.tournamentId);
      await this.reloadStage();
      this.pageMessage.set({ text: 'Mata-mata gerado com os classificados dos grupos.', ok: true });
    } catch (error: unknown) {
      this.pageMessage.set({ text: this.resolveError(error, 'Não foi possível gerar o mata-mata.'), ok: false });
    } finally {
      this.generatingKnockout.set(false);
    }
  }

  // ── Helpers de template ───────────────────────────────────

  tieOrderFor(letter: string): string[] {
    return this.tieOrders()[letter] ?? [];
  }

  teamName(teamId: string): string {
    return this.stage()?.teamInfo[teamId]?.name ?? this.drawTeams().find((t) => t.id === teamId)?.name ?? 'Time sem nome';
  }

  // ── Privados ──────────────────────────────────────────────

  private async loadPage(tournamentId: string): Promise<void> {
    this.state.set('loading');
    await this.loadTournamentInfo(tournamentId);

    if (!this.isGroupsTournament()) {
      this.pageError.set('Este torneio não usa fase de grupos.');
      this.state.set('error');
      return;
    }

    try {
      this.applyStage(await this.grupos.getGroupStage(tournamentId));
      this.state.set('loaded');
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.state.set('no-stage');
        await this.loadDrawTeams();
      } else {
        this.pageError.set(this.resolveError(error, 'Não foi possível carregar a fase de grupos.'));
        this.state.set('error');
      }
    }
  }

  private async loadTournamentInfo(tournamentId: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${environment.apiURLTorneios}/${tournamentId}`),
      );
      if (!this.isRecord(response)) return;
      this.tournamentName.set(this.readString(response, 'name'));
      this.tournamentStatus.set(this.readString(response, 'status'));
      this.tournamentFormat.set(this.readString(response, 'format'));
      this.teamMode.set((this.readString(response, 'teamMode') ?? '').toLowerCase() || null);
      this.knockoutFormat.set(this.readString(response, 'knockoutFormat'));
      const max = response['maxTeams'];
      this.maxTeams.set(typeof max === 'number' ? max : null);
    } catch {
      // segue com os dados que tiver; a validação final é do backend
    }
  }

  private async loadDrawTeams(): Promise<void> {
    if (!this.tournamentId) return;
    this.loadingTeams.set(true);
    const result = await this.tournamentTeams.loadForDraw(this.tournamentId, this.teamMode());
    this.drawTeams.set(result.teams);
    this.drawTeamsMessage.set(result.message);
    this.loadingTeams.set(false);
  }

  private async createGroups(groups: string[][]): Promise<void> {
    if (!this.tournamentId) return;
    this.creating.set(true);
    this.createMessage.set(null);
    try {
      this.applyStage(await this.grupos.createGroupStage(this.tournamentId, groups));
      this.state.set('loaded');
    } catch (error: unknown) {
      this.createMessage.set({ text: this.resolveError(error, 'Não foi possível gerar os grupos.'), ok: false });
    } finally {
      this.creating.set(false);
    }
  }

  private async reloadStage(): Promise<void> {
    if (!this.tournamentId) return;
    this.applyStage(await this.grupos.getGroupStage(this.tournamentId));
  }

  private applyStage(stage: GroupStage): void {
    this.stage.set(stage);
    const orders: Record<string, string[]> = {};
    for (const group of stage.groups) {
      if (stage.blockingTieGroups.includes(group.letter)) {
        orders[group.letter] = group.standings.map((row) => row.teamId);
      }
    }
    this.tieOrders.set(orders);
  }

  /** Payload do resultado, ou a mensagem de erro de validação. */
  private buildReportPayload(): ReportGroupMatchPayload | string {
    if (this.reportWalkover()) {
      const winnerId = this.reportWinnerId().trim();
      if (!winnerId) return 'Escolha quem venceu por W.O.';
      return { walkover: true, winnerId };
    }

    const team1Score = this.parseScore(this.reportScore1());
    const team2Score = this.parseScore(this.reportScore2());
    if (team1Score === null || team2Score === null) return 'Informe o placar dos dois times (inteiro ≥ 0).';
    if (team1Score === team2Score) return 'Não existe empate: o placar precisa ter um vencedor.';
    return { team1Score, team2Score };
  }

  private parseScore(raw: string): number | null {
    const trimmed = String(raw ?? '').trim();
    if (!/^\d+$/.test(trimmed)) return null;
    return Number.parseInt(trimmed, 10);
  }

  private shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
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
      const backendMessage = typeof error.error?.message === 'string' ? error.error.message : null;
      if (backendMessage) return backendMessage;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallbackMessage;
  }
}
