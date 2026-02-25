import { TeamTournamentSummary } from './team-tournament-summary.interface';
import { TeamTrophySummary } from './team-trophy-summary.interface';

export interface TeamTournamentsOverview {
  readonly teamId: string;
  readonly tournaments: readonly TeamTournamentSummary[];
  readonly trophies: readonly TeamTrophySummary[];
}
