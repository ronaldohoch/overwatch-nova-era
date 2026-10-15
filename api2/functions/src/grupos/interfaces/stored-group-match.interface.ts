import { GroupMatchStatus } from './group-match-status.type';

export interface StoredGroupMatch {
  readonly matchNumber: number;
  readonly group: string;
  readonly round: number;
  readonly team1Id: string;
  readonly team2Id: string;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly winnerId: string | null;
  readonly walkover: boolean;
  readonly status: GroupMatchStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
