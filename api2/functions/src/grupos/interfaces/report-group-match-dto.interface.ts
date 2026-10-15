export interface ReportGroupMatchDto {
  readonly team1Score?: unknown;
  readonly team2Score?: unknown;
  /** W.O.: exige winnerId; o placar vira 2x0 automaticamente. */
  readonly walkover?: unknown;
  readonly winnerId?: unknown;
}
