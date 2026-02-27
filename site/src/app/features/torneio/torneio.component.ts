import { Component, signal } from '@angular/core';
import { PodiumComponent } from './components/podium/podium.component';
import { DoubleEliminationComponent } from './brackets/double-elimination/double-elimination.component';
import { Bracket } from './brackets/brackets.service';
import { TeamDisplay } from './components/match-card/match-card.component';
import { MatchFormat } from './enums/match-format';

// Interfaces mantidas para compatibilidade com TorneioItemComponent
export interface Member { name: string; battletag: string; }
export interface Team { title: string; members: readonly Member[]; }
export interface MatchScore { teamA: number; teamB: number; }
export interface Match {
  id?: string;
  format: MatchFormat;
  data: string;
  teamA: Team;
  teamB: Team;
  winnerTeamId: string;
  score: MatchScore;
  winner?: 'A' | 'B';
}
export interface Tournament { title: string; teams: readonly Team[]; matches: readonly Match[]; }

// ──────────────────────────────────────────────────────────────────────────────
// IDs dos times (mock)
// ──────────────────────────────────────────────────────────────────────────────
const T1 = 't1', T2 = 't2', T3 = 't3', T4 = 't4';
const T5 = 't5', T6 = 't6', T7 = 't7', T8 = 't8';

// ──────────────────────────────────────────────────────────────────────────────
// Bracket mock: 8 times — 14 partidas
// Estado: M1-M11 concluídos; M12 = ready; M13 e M14 = pending
// ──────────────────────────────────────────────────────────────────────────────
const MOCK_BRACKET: Bracket = {
  id: 'torneio-demo',
  tournamentId: 'torneio-demo',
  type: 'double-elimination',
  teamCount: 8,
  status: 'running',
  seedMap: { 1: T1, 2: T2, 3: T3, 4: T4, 5: T5, 6: T6, 7: T7, 8: T8 },
  winnerId: null,

  matches: [
    // ── WB R1 ─────────────────────────────────────────────
    {
      id: '1', matchNumber: 1, round: 1, side: 'winners',
      slot1: { type: 'seed', ref: 1 }, slot2: { type: 'seed', ref: 2 },
      team1Id: T1, team2Id: T2,
      team1Score: 3, team2Score: 1, winnerId: T1, loserId: T2, status: 'finished',
    },
    {
      id: '2', matchNumber: 2, round: 1, side: 'winners',
      slot1: { type: 'seed', ref: 3 }, slot2: { type: 'seed', ref: 4 },
      team1Id: T3, team2Id: T4,
      team1Score: 3, team2Score: 2, winnerId: T3, loserId: T4, status: 'finished',
    },
    {
      id: '3', matchNumber: 3, round: 1, side: 'winners',
      slot1: { type: 'seed', ref: 5 }, slot2: { type: 'seed', ref: 6 },
      team1Id: T5, team2Id: T6,
      team1Score: 3, team2Score: 0, winnerId: T5, loserId: T6, status: 'finished',
    },
    {
      id: '4', matchNumber: 4, round: 1, side: 'winners',
      slot1: { type: 'seed', ref: 7 }, slot2: { type: 'seed', ref: 8 },
      team1Id: T7, team2Id: T8,
      team1Score: 1, team2Score: 3, winnerId: T8, loserId: T7, status: 'finished',
    },

    // ── LB R1 (cruzado: L(M1)xL(M3), L(M2)xL(M4)) ───────
    {
      id: '5', matchNumber: 5, round: 1, side: 'losers',
      slot1: { type: 'loser_of', ref: 1 }, slot2: { type: 'loser_of', ref: 3 },
      team1Id: T2, team2Id: T6,
      team1Score: 3, team2Score: 1, winnerId: T2, loserId: T6, status: 'finished',
    },
    {
      id: '6', matchNumber: 6, round: 1, side: 'losers',
      slot1: { type: 'loser_of', ref: 2 }, slot2: { type: 'loser_of', ref: 4 },
      team1Id: T4, team2Id: T7,
      team1Score: 3, team2Score: 2, winnerId: T4, loserId: T7, status: 'finished',
    },

    // ── WB R2 ─────────────────────────────────────────────
    {
      id: '7', matchNumber: 7, round: 2, side: 'winners',
      slot1: { type: 'winner_of', ref: 1 }, slot2: { type: 'winner_of', ref: 2 },
      team1Id: T1, team2Id: T3,
      team1Score: 3, team2Score: 1, winnerId: T1, loserId: T3, status: 'finished',
    },
    {
      id: '8', matchNumber: 8, round: 2, side: 'winners',
      slot1: { type: 'winner_of', ref: 3 }, slot2: { type: 'winner_of', ref: 4 },
      team1Id: T5, team2Id: T8,
      team1Score: 0, team2Score: 3, winnerId: T8, loserId: T5, status: 'finished',
    },

    // ── LB R2 (L(M7)xW(M5), L(M8)xW(M6)) ────────────────
    {
      id: '9', matchNumber: 9, round: 2, side: 'losers',
      slot1: { type: 'loser_of', ref: 7 }, slot2: { type: 'winner_of', ref: 5 },
      team1Id: T3, team2Id: T2,
      team1Score: 3, team2Score: 2, winnerId: T3, loserId: T2, status: 'finished',
    },
    {
      id: '10', matchNumber: 10, round: 2, side: 'losers',
      slot1: { type: 'loser_of', ref: 8 }, slot2: { type: 'winner_of', ref: 6 },
      team1Id: T5, team2Id: T4,
      team1Score: 3, team2Score: 1, winnerId: T5, loserId: T4, status: 'finished',
    },

    // ── WB Final ──────────────────────────────────────────
    {
      id: '11', matchNumber: 11, round: 3, side: 'winners',
      slot1: { type: 'winner_of', ref: 7 }, slot2: { type: 'winner_of', ref: 8 },
      team1Id: T1, team2Id: T8,
      team1Score: 3, team2Score: 2, winnerId: T1, loserId: T8, status: 'finished',
    },

    // ── LB Semi (em jogo) ─────────────────────────────────
    {
      id: '12', matchNumber: 12, round: 3, side: 'losers',
      slot1: { type: 'winner_of', ref: 9 }, slot2: { type: 'winner_of', ref: 10 },
      team1Id: T3, team2Id: T5,
      team1Score: null, team2Score: null, winnerId: null, loserId: null, status: 'running',
    },

    // ── LB Final (aguardando LB Semi) ─────────────────────
    {
      id: '13', matchNumber: 13, round: 4, side: 'losers',
      slot1: { type: 'loser_of', ref: 11 }, slot2: { type: 'winner_of', ref: 12 },
      team1Id: T8, team2Id: null,
      team1Score: null, team2Score: null, winnerId: null, loserId: null, status: 'pending',
    },

    // ── Grande Final (T1 aguarda campeão da LB) ───────────
    {
      id: '14', matchNumber: 14, round: 1, side: 'grand-final',
      slot1: { type: 'winner_of', ref: 11 }, slot2: { type: 'winner_of', ref: 13 },
      team1Id: T1, team2Id: null,
      team1Score: null, team2Score: null, winnerId: null, loserId: null, status: 'pending',
    },
  ],
};

const MOCK_TEAMS: Record<string, TeamDisplay> = {
  t1: { id: T1, name: 'Alpha Squad' },
  t2: { id: T2, name: 'Beta Force' },
  t3: { id: T3, name: 'Gamma Rush' },
  t4: { id: T4, name: 'Delta Strike' },
  t5: { id: T5, name: 'Epsilon' },
  t6: { id: T6, name: 'Zeta Ops' },
  t7: { id: T7, name: 'Eta Team' },
  t8: { id: T8, name: 'Theta Crew' },
};

@Component({
  selector: 'app-torneio',
  imports: [PodiumComponent, DoubleEliminationComponent],
  templateUrl: './torneio.component.html',
  styleUrl: './torneio.component.css',
})
export class TorneioComponent {
  readonly bracket = signal<Bracket>(MOCK_BRACKET);
  readonly teams = signal<Record<string, TeamDisplay>>(MOCK_TEAMS);
}
