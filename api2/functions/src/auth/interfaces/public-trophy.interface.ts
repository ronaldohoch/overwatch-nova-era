import { PublicTrophyTarget } from './public-trophy-target.type';

export interface PublicTrophy {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly icon: string;
  readonly target: PublicTrophyTarget;
  readonly assignedAt: string;
}
