/** Quem disparou o check-in do time: o proprio capitao ou um admin agindo pelo time. */
export type TeamCheckinActorRole = 'captain' | 'admin';

/** Usuario autenticado que esta executando a acao de check-in de time. */
export interface TeamCheckinActor {
  uid: string;
  role: string;
}

/** Time inscrito em um torneio, com os dados de quem registrou o check-in. */
export interface TournamentTeamCheckin {
  id: string;
  teamId: string;
  name: string | null;
  tag: string | null;
  captainUid: string | null;
  membersCount: number;
  source: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedInByUid: string | null;
  checkedInByRole: TeamCheckinActorRole | null;
  checkedInByName: string | null;
}
