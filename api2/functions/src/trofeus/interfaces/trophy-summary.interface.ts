import { TrophyTarget } from './trophy-target.type';

export interface TrophySummary {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly icon: string;
  readonly target: TrophyTarget;
  readonly assignedAt: string;
}
