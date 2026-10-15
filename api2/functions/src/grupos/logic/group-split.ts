/** Mínimo de times: dois grupos de 3. */
export const MIN_GROUP_STAGE_TEAMS = 6;
/** Máximo de times: 16 grupos de 4, que classificam 32 para a maior chave suportada. */
export const MAX_GROUP_STAGE_TEAMS = 64;

/**
 * Tamanho de cada grupo para `teamCount` times: grupos de 4, completando com
 * grupos de 3 quando a conta não fecha. Ex.: 10 → [4, 3, 3], 13 → [4, 3, 3, 3].
 */
export function groupSizes(teamCount: number): number[] {
  if (!Number.isInteger(teamCount) || teamCount < MIN_GROUP_STAGE_TEAMS) {
    throw new Error(`A fase de grupos precisa de pelo menos ${MIN_GROUP_STAGE_TEAMS} times (recebeu ${teamCount}).`);
  }
  if (teamCount > MAX_GROUP_STAGE_TEAMS) {
    throw new Error(`A fase de grupos comporta no máximo ${MAX_GROUP_STAGE_TEAMS} times (recebeu ${teamCount}).`);
  }

  const groupCount = Math.ceil(teamCount / 4);
  const groupsOfThree = groupCount * 4 - teamCount;
  return Array.from({ length: groupCount }, (_, i) => (i < groupCount - groupsOfThree ? 4 : 3));
}

/** A, B, C... */
export function groupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

/** Corta a lista (já sorteada) em grupos na ordem de `groupSizes`. */
export function splitIntoGroups(orderedTeamIds: readonly string[]): string[][] {
  const groups: string[][] = [];
  let cursor = 0;
  for (const size of groupSizes(orderedTeamIds.length)) {
    groups.push(orderedTeamIds.slice(cursor, cursor + size));
    cursor += size;
  }
  return groups;
}

/**
 * Valida grupos montados à mão: mesmo número de grupos e de grupos de 3/4 que
 * a divisão automática daria, sem time repetido. A ordem dos grupos é livre.
 */
export function assertValidGroups(groups: readonly (readonly string[])[]): void {
  const all = groups.flat();
  if (new Set(all).size !== all.length) throw new Error('Um time aparece em mais de um grupo.');

  const expected = groupSizes(all.length).sort().join(',');
  const received = groups.map((g) => g.length).sort().join(',');
  if (expected !== received) {
    const expectedGroups = groupSizes(all.length);
    throw new Error(
      `Com ${all.length} times, os grupos devem ser ${expectedGroups.length} ` +
      `(tamanhos ${expectedGroups.join(', ')}). Recebido: ${groups.map((g) => g.length).join(', ')}.`,
    );
  }
}
