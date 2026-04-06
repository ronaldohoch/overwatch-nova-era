import { CdkDragDrop, CdkDrag, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, input, output } from '@angular/core';
import { MatchCardComponent, TeamDisplay } from '../../components/match-card/match-card.component';
import { Bracket, BracketMatch } from '../brackets.service';

interface RoundData {
  round: number;
  label: string;
  matches: BracketMatch[];
  slotHeightPx: string;
}

// Altura base por slot (card ~142px + folga vertical)
const BASE_SLOT_PX = 160;

@Component({
  selector: 'app-double-elimination',
  imports: [CdkDrag, CdkDragPlaceholder, CdkDropList, CdkDropListGroup, MatchCardComponent],
  templateUrl: './double-elimination.component.html',
})
export class DoubleEliminationComponent {
  bracket = input.required<Bracket>();
  teams = input<Record<string, TeamDisplay>>({});
  canReport = input(false);
  canReorder = input(false);
  readonly reportRequested = output<BracketMatch>();
  readonly seedSwapped = output<{ seed1: number; seed2: number }>();

  // ── Agrupamentos internos ─────────────────────────────────

  private readonly _wbGrouped = computed(() =>
    this.groupByRound(this.bracket().matches.filter((m) => m.side === 'winners')),
  );

  private readonly _lbGrouped = computed(() =>
    this.groupByRound(this.bracket().matches.filter((m) => m.side === 'losers')),
  );

  // ── Alturas das seções (em px) ────────────────────────────

  readonly wbSectionHeightPx = computed(() => {
    const r1Count = this._wbGrouped().get(1)?.length ?? 1;
    return `${r1Count * BASE_SLOT_PX}px`;
  });

  readonly lbSectionHeightPx = computed(() => {
    const grouped = this._lbGrouped();
    const maxCount = Math.max(...Array.from(grouped.values()).map((m) => m.length), 1);
    return `${maxCount * BASE_SLOT_PX}px`;
  });

  // ── Rodadas para o template ───────────────────────────────

  readonly wbRounds = computed<RoundData[]>(() => {
    const grouped = this._wbGrouped();
    const r1Count = grouped.get(1)?.length ?? 1;
    const sectionHeight = r1Count * BASE_SLOT_PX;
    const total = grouped.size;

    return Array.from(grouped.entries()).map(([round, matches]) => ({
      round,
      label: this.wbRoundLabel(round, total),
      matches,
      slotHeightPx: `${sectionHeight / matches.length}px`,
    }));
  });

  readonly lbRounds = computed<RoundData[]>(() => {
    const grouped = this._lbGrouped();
    const maxCount = Math.max(...Array.from(grouped.values()).map((m) => m.length), 1);
    const sectionHeight = maxCount * BASE_SLOT_PX;
    const total = grouped.size;

    return Array.from(grouped.entries()).map(([round, matches]) => ({
      round,
      label: this.lbRoundLabel(round, total),
      matches,
      slotHeightPx: `${sectionHeight / matches.length}px`,
    }));
  });

  readonly grandFinal = computed(() =>
    this.bracket().matches.find((m) => m.side === 'grand-final') ?? null,
  );

  // ── Helpers para o template ───────────────────────────────

  getTeam(teamId: string | null): TeamDisplay | null {
    if (!teamId) return null;
    return this.teams()[teamId] ?? null;
  }

  onReportRequested(match: BracketMatch): void {
    this.reportRequested.emit(match);
  }

  /** Retorna true se a partida pertence à WB R1 e pode ser reordenada. */
  isReorderableMatch(match: BracketMatch): boolean {
    if (!this.canReorder()) return false;
    if (match.side !== 'winners' || match.round !== 1) return false;
    return match.status === 'pending' || match.status === 'ready';
  }

  /** Handler do CDK drop — emite swap se os seeds forem diferentes. */
  onSeedDrop(event: CdkDragDrop<number, number, number>): void {
    const sourceSeed = event.item.data;
    const targetSeed = event.container.data;
    if (sourceSeed !== targetSeed) {
      this.seedSwapped.emit({ seed1: sourceSeed, seed2: targetSeed });
    }
  }

  /** Nome do time pelo ID (fallback "A definir"). */
  teamDisplayName(teamId: string | null): string {
    if (!teamId) return 'A definir';
    return this.teams()[teamId]?.name ?? 'A definir';
  }

  /** Iniciais para fallback de logo. */
  teamDisplayInitials(teamId: string | null): string {
    if (!teamId) return '??';
    const team = this.teams()[teamId];
    if (!team?.name) return '??';
    return team.name.trim().substring(0, 2).toUpperCase();
  }

  // ── Helpers privados ──────────────────────────────────────

  private groupByRound(matches: BracketMatch[]): Map<number, BracketMatch[]> {
    const map = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      if (!map.has(m.round)) map.set(m.round, []);
      map.get(m.round)!.push(m);
    }
    return new Map([...map.entries()].sort(([a], [b]) => a - b));
  }

  private wbRoundLabel(round: number, total: number): string {
    if (round === total) return 'Final';
    if (round === total - 1 && total > 2) return 'Semi';
    return `Rodada ${round}`;
  }

  private lbRoundLabel(round: number, total: number): string {
    if (round === total) return 'Final';
    return `Rodada ${round}`;
  }
}
