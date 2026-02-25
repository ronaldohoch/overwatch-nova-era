import { TrophyActorRole } from './trophy-actor-role.type';
import { TrophyAutomation } from './trophy-automation.interface';
import { TrophyTarget } from './trophy-target.type';

export interface StoredTrophyCatalog {
  readonly code: string;
  readonly codeLower: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string;
  readonly target: TrophyTarget;
  readonly active: boolean;
  readonly automation: TrophyAutomation;
  readonly createdAt: string;
  readonly updatedAt: string | FirebaseFirestore.FieldValue;
  readonly createdByUid: string;
  readonly createdByRole: TrophyActorRole;
}
