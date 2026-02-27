import { BracketSide } from '../interfaces/bracket-side.type';
import { MatchSlot } from '../interfaces/match-slot.interface';

export interface MatchTemplate {
  readonly matchNumber: number;
  readonly round: number;
  readonly side: BracketSide;
  readonly slot1: MatchSlot;
  readonly slot2: MatchSlot;
}

function seed(ref: number): MatchSlot {
  return { type: 'seed', ref };
}

function winnerOf(ref: number): MatchSlot {
  return { type: 'winner_of', ref };
}

function loserOf(ref: number): MatchSlot {
  return { type: 'loser_of', ref };
}

// ──────────────────────────────────────────────────────────
// 4 times — 6 partidas
// WB: M1-M2 (R1), M4 (Final)
// LB: M3 (R1), M5 (Final)
// GF: M6
// ──────────────────────────────────────────────────────────
const TEMPLATE_4: readonly MatchTemplate[] = [
  { matchNumber: 1, round: 1, side: 'winners', slot1: seed(1), slot2: seed(2) },
  { matchNumber: 2, round: 1, side: 'winners', slot1: seed(3), slot2: seed(4) },
  { matchNumber: 3, round: 1, side: 'losers', slot1: loserOf(1), slot2: loserOf(2) },
  { matchNumber: 4, round: 2, side: 'winners', slot1: winnerOf(1), slot2: winnerOf(2) },
  { matchNumber: 5, round: 2, side: 'losers', slot1: loserOf(4), slot2: winnerOf(3) },
  { matchNumber: 6, round: 1, side: 'grand-final', slot1: winnerOf(4), slot2: winnerOf(5) },
];

// ──────────────────────────────────────────────────────────
// 8 times — 14 partidas
// WB: M1-M4 (R1), M7-M8 (R2), M11 (Final)
// LB: M5-M6 (R1, cruzado), M9-M10 (R2), M12 (Semi), M13 (Final)
// GF: M14
// ──────────────────────────────────────────────────────────
const TEMPLATE_8: readonly MatchTemplate[] = [
  { matchNumber: 1, round: 1, side: 'winners', slot1: seed(1), slot2: seed(2) },
  { matchNumber: 2, round: 1, side: 'winners', slot1: seed(3), slot2: seed(4) },
  { matchNumber: 3, round: 1, side: 'winners', slot1: seed(5), slot2: seed(6) },
  { matchNumber: 4, round: 1, side: 'winners', slot1: seed(7), slot2: seed(8) },

  // LB R1 — cruzado: L(M1) x L(M3), L(M2) x L(M4)
  { matchNumber: 5, round: 1, side: 'losers', slot1: loserOf(1), slot2: loserOf(3) },
  { matchNumber: 6, round: 1, side: 'losers', slot1: loserOf(2), slot2: loserOf(4) },

  { matchNumber: 7, round: 2, side: 'winners', slot1: winnerOf(1), slot2: winnerOf(2) },
  { matchNumber: 8, round: 2, side: 'winners', slot1: winnerOf(3), slot2: winnerOf(4) },

  // LB R2 — derrotados WB R2 entram
  { matchNumber: 9, round: 2, side: 'losers', slot1: loserOf(7), slot2: winnerOf(5) },
  { matchNumber: 10, round: 2, side: 'losers', slot1: loserOf(8), slot2: winnerOf(6) },

  { matchNumber: 11, round: 3, side: 'winners', slot1: winnerOf(7), slot2: winnerOf(8) },

  // LB Semi
  { matchNumber: 12, round: 3, side: 'losers', slot1: winnerOf(9), slot2: winnerOf(10) },

  // LB Final
  { matchNumber: 13, round: 4, side: 'losers', slot1: loserOf(11), slot2: winnerOf(12) },

  { matchNumber: 14, round: 1, side: 'grand-final', slot1: winnerOf(11), slot2: winnerOf(13) },
];

// ──────────────────────────────────────────────────────────
// 16 times — 30 partidas
// WB: M1-M8 (R1), M9-M12 (R2), M13-M14 (SF), M15 (Final)
// LB: M16-M19 (R1, cruzado), M20-M23 (R2), M24-M25 (R3), M26-M27 (R4), M28 (R5), M29 (Final)
// GF: M30
// ──────────────────────────────────────────────────────────
const TEMPLATE_16: readonly MatchTemplate[] = [
  // WB R1
  { matchNumber: 1, round: 1, side: 'winners', slot1: seed(1), slot2: seed(2) },
  { matchNumber: 2, round: 1, side: 'winners', slot1: seed(3), slot2: seed(4) },
  { matchNumber: 3, round: 1, side: 'winners', slot1: seed(5), slot2: seed(6) },
  { matchNumber: 4, round: 1, side: 'winners', slot1: seed(7), slot2: seed(8) },
  { matchNumber: 5, round: 1, side: 'winners', slot1: seed(9), slot2: seed(10) },
  { matchNumber: 6, round: 1, side: 'winners', slot1: seed(11), slot2: seed(12) },
  { matchNumber: 7, round: 1, side: 'winners', slot1: seed(13), slot2: seed(14) },
  { matchNumber: 8, round: 1, side: 'winners', slot1: seed(15), slot2: seed(16) },

  // WB R2
  { matchNumber: 9,  round: 2, side: 'winners', slot1: winnerOf(1), slot2: winnerOf(2) },
  { matchNumber: 10, round: 2, side: 'winners', slot1: winnerOf(3), slot2: winnerOf(4) },
  { matchNumber: 11, round: 2, side: 'winners', slot1: winnerOf(5), slot2: winnerOf(6) },
  { matchNumber: 12, round: 2, side: 'winners', slot1: winnerOf(7), slot2: winnerOf(8) },

  // WB SF
  { matchNumber: 13, round: 3, side: 'winners', slot1: winnerOf(9),  slot2: winnerOf(10) },
  { matchNumber: 14, round: 3, side: 'winners', slot1: winnerOf(11), slot2: winnerOf(12) },

  // WB Final
  { matchNumber: 15, round: 4, side: 'winners', slot1: winnerOf(13), slot2: winnerOf(14) },

  // LB R1 — cruzado: L(M1-M4) x L(M5-M8)
  { matchNumber: 16, round: 1, side: 'losers', slot1: loserOf(1), slot2: loserOf(5) },
  { matchNumber: 17, round: 1, side: 'losers', slot1: loserOf(2), slot2: loserOf(6) },
  { matchNumber: 18, round: 1, side: 'losers', slot1: loserOf(3), slot2: loserOf(7) },
  { matchNumber: 19, round: 1, side: 'losers', slot1: loserOf(4), slot2: loserOf(8) },

  // LB R2 — WB R2 losers entram
  { matchNumber: 20, round: 2, side: 'losers', slot1: loserOf(9),  slot2: winnerOf(16) },
  { matchNumber: 21, round: 2, side: 'losers', slot1: loserOf(10), slot2: winnerOf(17) },
  { matchNumber: 22, round: 2, side: 'losers', slot1: loserOf(11), slot2: winnerOf(18) },
  { matchNumber: 23, round: 2, side: 'losers', slot1: loserOf(12), slot2: winnerOf(19) },

  // LB R3 — vencedores LB R2 jogam entre si
  { matchNumber: 24, round: 3, side: 'losers', slot1: winnerOf(20), slot2: winnerOf(21) },
  { matchNumber: 25, round: 3, side: 'losers', slot1: winnerOf(22), slot2: winnerOf(23) },

  // LB R4 — WB SF losers entram
  { matchNumber: 26, round: 4, side: 'losers', slot1: loserOf(13), slot2: winnerOf(24) },
  { matchNumber: 27, round: 4, side: 'losers', slot1: loserOf(14), slot2: winnerOf(25) },

  // LB R5 — vencedores LB R4 jogam entre si
  { matchNumber: 28, round: 5, side: 'losers', slot1: winnerOf(26), slot2: winnerOf(27) },

  // LB Final — WB Final loser entra
  { matchNumber: 29, round: 6, side: 'losers', slot1: loserOf(15), slot2: winnerOf(28) },

  { matchNumber: 30, round: 1, side: 'grand-final', slot1: winnerOf(15), slot2: winnerOf(29) },
];

// ──────────────────────────────────────────────────────────
// 32 times — 62 partidas
// WB: M1-M16 (R1), M17-M24 (R2), M25-M28 (R3), M29-M30 (R4), M31 (Final)
// LB: M32-M39 (R1, cruzado), M40-M47 (R2), M48-M51 (R3),
//     M52-M55 (R4), M56-M57 (R5), M58-M59 (R6), M60 (R7), M61 (Final)
// GF: M62
// ──────────────────────────────────────────────────────────
const TEMPLATE_32: readonly MatchTemplate[] = [
  // WB R1
  { matchNumber: 1,  round: 1, side: 'winners', slot1: seed(1),  slot2: seed(2)  },
  { matchNumber: 2,  round: 1, side: 'winners', slot1: seed(3),  slot2: seed(4)  },
  { matchNumber: 3,  round: 1, side: 'winners', slot1: seed(5),  slot2: seed(6)  },
  { matchNumber: 4,  round: 1, side: 'winners', slot1: seed(7),  slot2: seed(8)  },
  { matchNumber: 5,  round: 1, side: 'winners', slot1: seed(9),  slot2: seed(10) },
  { matchNumber: 6,  round: 1, side: 'winners', slot1: seed(11), slot2: seed(12) },
  { matchNumber: 7,  round: 1, side: 'winners', slot1: seed(13), slot2: seed(14) },
  { matchNumber: 8,  round: 1, side: 'winners', slot1: seed(15), slot2: seed(16) },
  { matchNumber: 9,  round: 1, side: 'winners', slot1: seed(17), slot2: seed(18) },
  { matchNumber: 10, round: 1, side: 'winners', slot1: seed(19), slot2: seed(20) },
  { matchNumber: 11, round: 1, side: 'winners', slot1: seed(21), slot2: seed(22) },
  { matchNumber: 12, round: 1, side: 'winners', slot1: seed(23), slot2: seed(24) },
  { matchNumber: 13, round: 1, side: 'winners', slot1: seed(25), slot2: seed(26) },
  { matchNumber: 14, round: 1, side: 'winners', slot1: seed(27), slot2: seed(28) },
  { matchNumber: 15, round: 1, side: 'winners', slot1: seed(29), slot2: seed(30) },
  { matchNumber: 16, round: 1, side: 'winners', slot1: seed(31), slot2: seed(32) },

  // WB R2
  { matchNumber: 17, round: 2, side: 'winners', slot1: winnerOf(1),  slot2: winnerOf(2)  },
  { matchNumber: 18, round: 2, side: 'winners', slot1: winnerOf(3),  slot2: winnerOf(4)  },
  { matchNumber: 19, round: 2, side: 'winners', slot1: winnerOf(5),  slot2: winnerOf(6)  },
  { matchNumber: 20, round: 2, side: 'winners', slot1: winnerOf(7),  slot2: winnerOf(8)  },
  { matchNumber: 21, round: 2, side: 'winners', slot1: winnerOf(9),  slot2: winnerOf(10) },
  { matchNumber: 22, round: 2, side: 'winners', slot1: winnerOf(11), slot2: winnerOf(12) },
  { matchNumber: 23, round: 2, side: 'winners', slot1: winnerOf(13), slot2: winnerOf(14) },
  { matchNumber: 24, round: 2, side: 'winners', slot1: winnerOf(15), slot2: winnerOf(16) },

  // WB R3
  { matchNumber: 25, round: 3, side: 'winners', slot1: winnerOf(17), slot2: winnerOf(18) },
  { matchNumber: 26, round: 3, side: 'winners', slot1: winnerOf(19), slot2: winnerOf(20) },
  { matchNumber: 27, round: 3, side: 'winners', slot1: winnerOf(21), slot2: winnerOf(22) },
  { matchNumber: 28, round: 3, side: 'winners', slot1: winnerOf(23), slot2: winnerOf(24) },

  // WB R4
  { matchNumber: 29, round: 4, side: 'winners', slot1: winnerOf(25), slot2: winnerOf(26) },
  { matchNumber: 30, round: 4, side: 'winners', slot1: winnerOf(27), slot2: winnerOf(28) },

  // WB Final
  { matchNumber: 31, round: 5, side: 'winners', slot1: winnerOf(29), slot2: winnerOf(30) },

  // LB R1 — cruzado: L(M1-M8) x L(M9-M16)
  { matchNumber: 32, round: 1, side: 'losers', slot1: loserOf(1),  slot2: loserOf(9)  },
  { matchNumber: 33, round: 1, side: 'losers', slot1: loserOf(2),  slot2: loserOf(10) },
  { matchNumber: 34, round: 1, side: 'losers', slot1: loserOf(3),  slot2: loserOf(11) },
  { matchNumber: 35, round: 1, side: 'losers', slot1: loserOf(4),  slot2: loserOf(12) },
  { matchNumber: 36, round: 1, side: 'losers', slot1: loserOf(5),  slot2: loserOf(13) },
  { matchNumber: 37, round: 1, side: 'losers', slot1: loserOf(6),  slot2: loserOf(14) },
  { matchNumber: 38, round: 1, side: 'losers', slot1: loserOf(7),  slot2: loserOf(15) },
  { matchNumber: 39, round: 1, side: 'losers', slot1: loserOf(8),  slot2: loserOf(16) },

  // LB R2 — WB R2 losers entram
  { matchNumber: 40, round: 2, side: 'losers', slot1: loserOf(17), slot2: winnerOf(32) },
  { matchNumber: 41, round: 2, side: 'losers', slot1: loserOf(18), slot2: winnerOf(33) },
  { matchNumber: 42, round: 2, side: 'losers', slot1: loserOf(19), slot2: winnerOf(34) },
  { matchNumber: 43, round: 2, side: 'losers', slot1: loserOf(20), slot2: winnerOf(35) },
  { matchNumber: 44, round: 2, side: 'losers', slot1: loserOf(21), slot2: winnerOf(36) },
  { matchNumber: 45, round: 2, side: 'losers', slot1: loserOf(22), slot2: winnerOf(37) },
  { matchNumber: 46, round: 2, side: 'losers', slot1: loserOf(23), slot2: winnerOf(38) },
  { matchNumber: 47, round: 2, side: 'losers', slot1: loserOf(24), slot2: winnerOf(39) },

  // LB R3 — vencedores LB R2 jogam entre si
  { matchNumber: 48, round: 3, side: 'losers', slot1: winnerOf(40), slot2: winnerOf(41) },
  { matchNumber: 49, round: 3, side: 'losers', slot1: winnerOf(42), slot2: winnerOf(43) },
  { matchNumber: 50, round: 3, side: 'losers', slot1: winnerOf(44), slot2: winnerOf(45) },
  { matchNumber: 51, round: 3, side: 'losers', slot1: winnerOf(46), slot2: winnerOf(47) },

  // LB R4 — WB R3 losers entram
  { matchNumber: 52, round: 4, side: 'losers', slot1: loserOf(25), slot2: winnerOf(48) },
  { matchNumber: 53, round: 4, side: 'losers', slot1: loserOf(26), slot2: winnerOf(49) },
  { matchNumber: 54, round: 4, side: 'losers', slot1: loserOf(27), slot2: winnerOf(50) },
  { matchNumber: 55, round: 4, side: 'losers', slot1: loserOf(28), slot2: winnerOf(51) },

  // LB R5 — vencedores LB R4 jogam entre si
  { matchNumber: 56, round: 5, side: 'losers', slot1: winnerOf(52), slot2: winnerOf(53) },
  { matchNumber: 57, round: 5, side: 'losers', slot1: winnerOf(54), slot2: winnerOf(55) },

  // LB R6 — WB R4 losers entram
  { matchNumber: 58, round: 6, side: 'losers', slot1: loserOf(29), slot2: winnerOf(56) },
  { matchNumber: 59, round: 6, side: 'losers', slot1: loserOf(30), slot2: winnerOf(57) },

  // LB R7 — vencedores LB R6 jogam entre si
  { matchNumber: 60, round: 7, side: 'losers', slot1: winnerOf(58), slot2: winnerOf(59) },

  // LB Final — WB Final loser entra
  { matchNumber: 61, round: 8, side: 'losers', slot1: loserOf(31), slot2: winnerOf(60) },

  { matchNumber: 62, round: 1, side: 'grand-final', slot1: winnerOf(31), slot2: winnerOf(61) },
];

const TEMPLATES: Record<4 | 8 | 16 | 32, readonly MatchTemplate[]> = {
  4: TEMPLATE_4,
  8: TEMPLATE_8,
  16: TEMPLATE_16,
  32: TEMPLATE_32,
};

export function generateDoubleEliminationTemplate(teamCount: 4 | 8 | 16 | 32): MatchTemplate[] {
  return TEMPLATES[teamCount].map((t) => ({ ...t }));
}
