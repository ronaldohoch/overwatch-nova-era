import { BracketStatus } from './bracket-status.type';
import { BracketType } from './bracket-type.type';

export interface StoredBracket {
  readonly tournamentId: string;
  readonly type: BracketType;
  readonly teamCount: 4 | 8 | 16 | 32;
  readonly status: BracketStatus;
  readonly seedMap: Record<number, string>;
  readonly winnerId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
