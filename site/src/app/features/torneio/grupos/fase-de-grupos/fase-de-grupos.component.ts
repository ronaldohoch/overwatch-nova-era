import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BracketTeamInfo } from '../../brackets/brackets.service';
import { Group, GroupMatch, GroupStage, QUALIFIED_PER_GROUP, StandingRow } from '../grupos.service';

interface RoundView {
  readonly round: number;
  readonly matches: GroupMatch[];
  /** Times de folga na rodada (grupo de 3). */
  readonly resting: string[];
}

interface GroupView {
  readonly group: Group;
  readonly rounds: RoundView[];
  readonly hasBlockingTie: boolean;
}

/**
 * Fase de grupos em linhas: cada grupo mostra as rodadas lado a lado e a
 * classificação ao final. Usado na página pública e no painel do admin.
 */
@Component({
  selector: 'app-fase-de-grupos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fase-de-grupos.component.html',
})
export class FaseDeGruposComponent {
  readonly stage = input.required<GroupStage>();
  /** Mostra "Registrar"/"Corrigir" nas partidas (admin e streamer). */
  readonly canReport = input(false);
  readonly reportRequested = output<GroupMatch>();

  readonly qualifiedPerGroup = QUALIFIED_PER_GROUP;

  readonly groupViews = computed<GroupView[]>(() => {
    const stage = this.stage();
    return stage.groups.map((group) => {
      const groupMatches = stage.matches.filter((m) => m.group === group.letter);
      const roundNumbers = [...new Set(groupMatches.map((m) => m.round))].sort((a, b) => a - b);

      return {
        group,
        hasBlockingTie: stage.blockingTieGroups.includes(group.letter),
        rounds: roundNumbers.map((round) => {
          const matches = groupMatches.filter((m) => m.round === round);
          const playing = new Set(matches.flatMap((m) => [m.team1Id, m.team2Id]));
          return {
            round,
            matches,
            resting: group.teamIds.filter((id) => !playing.has(id)),
          };
        }),
      };
    });
  });

  readonly reportable = computed(() => this.canReport() && !this.stage().knockoutGenerated);

  team(teamId: string): BracketTeamInfo | null {
    return this.stage().teamInfo[teamId] ?? null;
  }

  teamName(teamId: string): string {
    return this.team(teamId)?.name ?? 'Time sem nome';
  }

  initials(teamId: string): string {
    return this.teamName(teamId).trim().substring(0, 2).toUpperCase();
  }

  isWinner(match: GroupMatch, teamId: string): boolean {
    return match.status === 'finished' && match.winnerId === teamId;
  }

  isLoser(match: GroupMatch, teamId: string): boolean {
    return match.status === 'finished' && match.winnerId !== teamId;
  }

  score(match: GroupMatch, side: 1 | 2): string {
    const value = side === 1 ? match.team1Score : match.team2Score;
    return value === null ? '–' : String(value);
  }

  formatDiff(row: StandingRow): string {
    return row.roundDiff > 0 ? `+${row.roundDiff}` : String(row.roundDiff);
  }

  isQualified(row: StandingRow): boolean {
    return row.position <= QUALIFIED_PER_GROUP;
  }

  onReport(match: GroupMatch): void {
    this.reportRequested.emit(match);
  }
}
