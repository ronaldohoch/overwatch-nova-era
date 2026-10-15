import { generateDoubleEliminationTemplate, MatchTemplate } from '../generators/double-elimination.generator';
import { generateSingleEliminationTemplate } from '../generators/single-elimination.generator';
import { BracketType } from '../interfaces/bracket-type.type';
import { MatchSlot } from '../interfaces/match-slot.interface';
import { MatchStatus } from '../interfaces/match-status.type';

/**
 * Motor puro da chave (sem Firestore): monta as partidas, resolve byes e
 * propaga vencedores/perdedores. O service só persiste o que mudou.
 */

export type BracketSize = 4 | 8 | 16 | 32;

export interface EngineMatch {
  matchNumber: number;
  slot1: MatchSlot;
  slot2: MatchSlot;
  team1Id: string | null;
  team2Id: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
  loserId: string | null;
  walkover?: boolean;
  bye?: boolean;
  status: MatchStatus;
}

export interface MatchResult {
  readonly winnerId: string;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly walkover: boolean;
}

/** matchNumber → [slot1 morto, slot2 morto]. Slot morto nunca receberá time. */
export type DeadSlots = ReadonlyMap<number, readonly [boolean, boolean]>;

export function templatesFor(type: BracketType, size: BracketSize): MatchTemplate[] {
  return type === 'single-elimination'
    ? generateSingleEliminationTemplate(size)
    : generateDoubleEliminationTemplate(size);
}

/** Menor chave suportada que comporta `teamCount` times. */
export function bracketSizeFor(teamCount: number): BracketSize {
  if (teamCount <= 4) return 4;
  if (teamCount <= 8) return 8;
  if (teamCount <= 16) return 16;
  if (teamCount <= 32) return 32;
  throw new Error(`Chave suporta no máximo 32 times (recebeu ${teamCount}).`);
}

/**
 * Slots mortos vêm de posições sem time (bye). Morte se espalha:
 * - vencedor de uma partida com os dois lados mortos não existe;
 * - perdedor de uma partida com qualquer lado morto não existe (bye não tem perdedor).
 */
export function findDeadSlots(
  templates: readonly MatchTemplate[],
  seedMap: Readonly<Record<number, string>>,
): DeadSlots {
  const byNumber = new Map(templates.map((t) => [t.matchNumber, t]));
  const memo = new Map<number, readonly [boolean, boolean]>();

  const deadOf = (matchNumber: number): readonly [boolean, boolean] => {
    const cached = memo.get(matchNumber);
    if (cached) return cached;
    const tpl = byNumber.get(matchNumber);
    if (!tpl) throw new Error(`Partida ${matchNumber} não existe no template.`);
    const result = [slotIsDead(tpl.slot1), slotIsDead(tpl.slot2)] as const;
    memo.set(matchNumber, result);
    return result;
  };

  const slotIsDead = (slot: MatchSlot): boolean => {
    if (slot.type === 'seed') return !seedMap[slot.ref];
    const [d1, d2] = deadOf(slot.ref);
    return slot.type === 'winner_of' ? d1 && d2 : d1 || d2;
  };

  for (const tpl of templates) deadOf(tpl.matchNumber);
  return memo;
}

/** A final é a única partida da qual nenhuma outra depende. */
export function finalMatchNumber(templates: readonly MatchTemplate[]): number {
  const referenced = new Set<number>();
  for (const t of templates) {
    if (t.slot1.type !== 'seed') referenced.add(t.slot1.ref);
    if (t.slot2.type !== 'seed') referenced.add(t.slot2.ref);
  }
  const finals = templates.filter((t) => !referenced.has(t.matchNumber));
  if (finals.length !== 1) throw new Error('Template de chave sem final única.');
  return finals[0].matchNumber;
}

/** Partidas iniciais com seeds resolvidos e byes já aplicados. */
export function buildMatches(
  templates: readonly MatchTemplate[],
  seedMap: Readonly<Record<number, string>>,
): EngineMatch[] {
  const matches: EngineMatch[] = templates.map((tpl) => ({
    matchNumber: tpl.matchNumber,
    slot1: tpl.slot1,
    slot2: tpl.slot2,
    team1Id: tpl.slot1.type === 'seed' ? (seedMap[tpl.slot1.ref] ?? null) : null,
    team2Id: tpl.slot2.type === 'seed' ? (seedMap[tpl.slot2.ref] ?? null) : null,
    team1Score: null,
    team2Score: null,
    winnerId: null,
    loserId: null,
    status: 'pending',
  }));

  settle(matches, findDeadSlots(templates, seedMap));
  return matches;
}

/** Registra o resultado e propaga. Muta `matches`. */
export function applyResult(
  matches: EngineMatch[],
  dead: DeadSlots,
  matchNumber: number,
  result: MatchResult,
): void {
  const match = matches.find((m) => m.matchNumber === matchNumber);
  if (!match) throw new Error(`Partida ${matchNumber} não encontrada.`);
  if (match.status !== 'ready' && match.status !== 'running') {
    throw new Error(`A partida ${matchNumber} está "${match.status}" e não pode receber resultado.`);
  }
  if (!match.team1Id || !match.team2Id) {
    throw new Error(`A partida ${matchNumber} ainda não tem os dois times definidos.`);
  }
  if (result.winnerId !== match.team1Id && result.winnerId !== match.team2Id) {
    throw new Error(`winnerId "${result.winnerId}" não é um dos times desta partida.`);
  }

  match.winnerId = result.winnerId;
  match.loserId = result.winnerId === match.team1Id ? match.team2Id : match.team1Id;
  match.team1Score = result.walkover ? null : result.team1Score;
  match.team2Score = result.walkover ? null : result.team2Score;
  match.walkover = result.walkover;
  match.status = 'finished';

  settle(matches, dead);
}

/**
 * Leva a chave a um ponto fixo: preenche slots com vencedores/perdedores já
 * conhecidos, encerra sozinhas as partidas de bye e libera as que têm dois times.
 */
function settle(matches: EngineMatch[], dead: DeadSlots): void {
  const byNumber = new Map(matches.map((m) => [m.matchNumber, m]));
  const ordered = [...matches].sort((a, b) => a.matchNumber - b.matchNumber);

  let changed = true;
  while (changed) {
    changed = false;

    for (const m of ordered) {
      if (m.status === 'finished') continue;
      const [dead1, dead2] = dead.get(m.matchNumber) ?? [false, false];

      const team1 = dead1 ? null : resolveSlot(m.slot1, byNumber) ?? m.team1Id;
      const team2 = dead2 ? null : resolveSlot(m.slot2, byNumber) ?? m.team2Id;
      if (team1 !== m.team1Id || team2 !== m.team2Id) {
        m.team1Id = team1;
        m.team2Id = team2;
        changed = true;
      }

      if (dead1 || dead2) {
        const survivor = dead1 ? m.team2Id : m.team1Id;
        if ((dead1 && dead2) || survivor) {
          m.winnerId = survivor;
          m.loserId = null;
          m.bye = true;
          m.status = 'finished';
          changed = true;
        }
        continue;
      }

      const nextStatus: MatchStatus = m.team1Id && m.team2Id ? 'ready' : 'pending';
      if (m.status === 'pending' && nextStatus === 'ready') {
        m.status = 'ready';
        changed = true;
      }
    }
  }
}

function resolveSlot(slot: MatchSlot, byNumber: ReadonlyMap<number, EngineMatch>): string | null {
  if (slot.type === 'seed') return null;
  const source = byNumber.get(slot.ref);
  if (!source || source.status !== 'finished') return null;
  return slot.type === 'winner_of' ? source.winnerId : source.loserId;
}
