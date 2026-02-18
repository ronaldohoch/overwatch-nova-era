export type TournamentStatus =
  | 'draft'
  | 'published'
  | 'checkin'
  | 'locked'
  | 'running'
  | 'finished'
  | 'canceled';

export interface SetStatusDto {
  status: TournamentStatus;
}
