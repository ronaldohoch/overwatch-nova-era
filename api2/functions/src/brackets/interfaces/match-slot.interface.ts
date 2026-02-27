export interface MatchSlot {
  readonly type: 'seed' | 'winner_of' | 'loser_of';
  readonly ref: number;
}
