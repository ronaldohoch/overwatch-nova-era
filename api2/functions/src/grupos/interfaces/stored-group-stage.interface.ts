import { KnockoutFormat } from './knockout-format.type';

export interface StoredGroupStage {
  readonly tournamentId: string;
  readonly groupCount: number;
  readonly teamCount: number;
  readonly knockoutFormat: KnockoutFormat;
  readonly createdAt: string;
  readonly updatedAt: string;
}
