import { TrophyAutomation } from './trophy-automation.interface';
import { TrophyTarget } from './trophy-target.type';

export interface CatalogEntity {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string;
  readonly target: TrophyTarget;
  readonly active: boolean;
  readonly automation: TrophyAutomation;
  readonly createdAt: string;
}
