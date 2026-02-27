import { BracketSide } from './bracket-side.type';
import { MatchSlot } from './match-slot.interface';
import { MatchStatus } from './match-status.type';

export interface StoredMatch {
  readonly matchNumber: number;
  readonly round: number;
  readonly side: BracketSide;
  readonly slot1: MatchSlot;
  readonly slot2: MatchSlot;
  readonly team1Id: string | null;
  readonly team2Id: string | null;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly winnerId: string | null;
  readonly loserId: string | null;
  readonly status: MatchStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
