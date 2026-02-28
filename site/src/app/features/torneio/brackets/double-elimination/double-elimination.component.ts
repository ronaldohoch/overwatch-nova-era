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
  imports: [MatchCardComponent],
  templateUrl: './double-elimination.component.html',
})
export class DoubleEliminationComponent {
  bracket = input.required<Bracket>();
  teams = input<Record<string, TeamDisplay>>({});
  canReport = input(false);
  readonly reportRequested = output<BracketMatch>();

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
