import { AwardMode } from './award-mode.type';
import { TrophyActorRole } from './trophy-actor-role.type';
import { TrophyTarget } from './trophy-target.type';

export interface StoredTrophyAssignment {
  readonly trophyId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string;
  readonly target: TrophyTarget;
  readonly awardedAt: string;
  readonly awardedByUid: string;
  readonly awardedByRole: TrophyActorRole;
  readonly mode: AwardMode;
  readonly reason: string | null;
  readonly sourceEvent: string | null;
}
