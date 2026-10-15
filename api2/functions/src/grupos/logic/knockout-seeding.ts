import { bracketSizeFor } from '../../brackets/engine/bracket-engine';

export interface QualifiedTeam {
  readonly teamId: string;
  readonly group: string;
  readonly groupPosition: 1 | 2;
  readonly played: number;
  readonly wins: number;
  readonly roundDiff: number;
  readonly roundsWon: number;
}

/**
 * Ranking geral dos classificados: todos os 1º colocados à frente dos 2º.
 * Dentro de cada faixa, compara aproveitamento e médias por partida, não
 * pontos brutos, porque grupos de 3 jogam menos que grupos de 4.
 */
export function rankQualifiers(teams: readonly QualifiedTeam[]): QualifiedTeam[] {
  const ratio = (value: number, played: number) => (played > 0 ? value / played : 0);
  const compare = (a: QualifiedTeam, b: QualifiedTeam) =>
    ratio(b.wins, b.played) - ratio(a.wins, a.played) ||
    ratio(b.roundDiff, b.played) - ratio(a.roundDiff, a.played) ||
    ratio(b.roundsWon, b.played) - ratio(a.roundsWon, a.played) ||
    a.group.localeCompare(b.group);

  const firsts = teams.filter((t) => t.groupPosition === 1).sort(compare);
  const seconds = teams.filter((t) => t.groupPosition === 2).sort(compare);
  return [...firsts, ...seconds];
}

/**
 * Ordem padrão de seeds nas posições da chave: o seed 1 enfrenta o último,
 * e 1 e 2 só se cruzam na final. 8 → [1, 8, 4, 5, 2, 7, 3, 6].
 */
export function standardSeedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const next = order.length * 2;
    order = order.flatMap((seed) => [seed, next + 1 - seed]);
  }
  return order;
}

/**
 * Posições do mata-mata (índice 0 = posição 1 da chave). `null` é bye, e os
 * byes ficam com os melhores do ranking. Na 1ª rodada, times do mesmo grupo
 * são separados trocando o pior colocado de cada par entre os jogos.
 */
export function buildKnockoutPositions(teams: readonly QualifiedTeam[]): (string | null)[] {
  const ranked = rankQualifiers(teams);
  const size = bracketSizeFor(ranked.length);
  const positions: (QualifiedTeam | null)[] = standardSeedOrder(size).map((seed) => ranked[seed - 1] ?? null);

  separateSameGroupPairs(positions, new Map(ranked.map((t, i) => [t.teamId, i + 1])));
  return positions.map((t) => t?.teamId ?? null);
}

function separateSameGroupPairs(positions: (QualifiedTeam | null)[], seedOf: ReadonlyMap<string, number>): void {
  const pairCount = positions.length / 2;
  const clash = (p: number) => {
    const a = positions[p * 2];
    const b = positions[p * 2 + 1];
    return !!a && !!b && a.group === b.group;
  };
  // Índice do pior colocado do par (o que pode ser trocado).
  const weakerIndex = (p: number) => {
    const a = positions[p * 2]!;
    const b = positions[p * 2 + 1]!;
    return seedOf.get(a.teamId)! > seedOf.get(b.teamId)! ? p * 2 : p * 2 + 1;
  };
  const isFullPair = (p: number) => !!positions[p * 2] && !!positions[p * 2 + 1];

  for (let p = 0; p < pairCount; p++) {
    if (!clash(p)) continue;

    // Primeiro tenta trocar dentro da mesma faixa (2º com 2º), depois qualquer uma.
    for (const sameTier of [true, false]) {
      let swapped = false;
      for (let q = 0; q < pairCount && !swapped; q++) {
        if (q === p || !isFullPair(q)) continue;
        const i = weakerIndex(p);
        const j = weakerIndex(q);
        if (sameTier && positions[i]!.groupPosition !== positions[j]!.groupPosition) continue;

        [positions[i], positions[j]] = [positions[j], positions[i]];
        if (!clash(p) && !clash(q)) {
          swapped = true;
        } else {
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
      }
      if (swapped) break;
    }
  }
}
