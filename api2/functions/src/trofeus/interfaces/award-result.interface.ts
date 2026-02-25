import { AwardTargetType } from './award-target-type.type';

export interface AwardResult {
  readonly targetType: AwardTargetType;
  readonly targetId: string;
  readonly trophyId: string;
  readonly trophyCode: string;
  readonly trophyName: string;
  readonly assigned: boolean;
  readonly alreadyAssigned: boolean;
}
