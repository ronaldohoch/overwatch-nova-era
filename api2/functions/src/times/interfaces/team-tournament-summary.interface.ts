import { ParticipationScope } from './participation-scope.type';

export interface TeamTournamentSummary {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly teamMode: string;
  readonly checkedIn: boolean;
  readonly startAt: string | null;
  readonly checkinDeadlineAt: string | null;
  readonly participationScope: ParticipationScope;
  readonly participationLabel: string;
  readonly trophyLabels: readonly string[];
}
