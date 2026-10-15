export interface Fixture {
  readonly round: number;
  readonly team1Id: string;
  readonly team2Id: string;
}

/**
 * Todos contra todos pelo método do círculo: o primeiro time fica fixo e os
 * demais giram. Grupo de 4 → 3 rodadas de 2 jogos. Grupo de 3 → 3 rodadas de
 * 1 jogo, com um time de folga em cada.
 */
export function roundRobin(teamIds: readonly string[]): Fixture[] {
  const list: (string | null)[] = [...teamIds];
  if (list.length % 2 !== 0) list.push(null);

  const n = list.length;
  const fixtures: Fixture[] = [];

  for (let round = 1; round < n; round++) {
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a && b) fixtures.push({ round, team1Id: a, team2Id: b });
    }
    // Gira todos menos o primeiro: o último entra na posição 1.
    list.splice(1, 0, list.pop()!);
  }

  return fixtures;
}
