import { ParticipationScope } from './participation-scope.type';

export interface TeamTournamentSummary {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly teamMode: string;
  readonly checkedIn: boolean;
  readonly checkedInAt: string | null;
  readonly checkedInByUid: string | null;
  readonly checkedInByRole: string | null;
  readonly checkedInByName: string | null;
  readonly startAt: string | null;
  readonly checkinDeadlineAt: string | null;
  readonly participationScope: ParticipationScope;
  readonly participationLabel: string;
  readonly trophyLabels: readonly string[];
}
