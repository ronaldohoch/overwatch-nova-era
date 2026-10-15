export const POINTS_WIN = 3;
export const POINTS_LOSS = 1;
/** Quem perde por W.O. não leva o ponto de participação. */
export const POINTS_WALKOVER_LOSS = 0;
/** Placar registrado num W.O. */
export const WALKOVER_SCORE = { winner: 2, loser: 0 } as const;

export interface GroupMatchOutcome {
  readonly team1Id: string;
  readonly team2Id: string;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly winnerId: string | null;
  readonly walkover: boolean;
  readonly status: 'pending' | 'finished';
}

export interface StandingRow {
  readonly teamId: string;
  readonly position: number;
  readonly played: number;
  readonly wins: number;
  readonly losses: number;
  readonly points: number;
  readonly roundsWon: number;
  readonly roundsLost: number;
  readonly roundDiff: number;
  /** Empate que nenhum critério nem a ordem manual do admin resolveu. */
  readonly tiedUnresolved: boolean;
}

type MutableRow = { -readonly [K in keyof StandingRow]: StandingRow[K] };

/**
 * Classificação do grupo. Critérios, em ordem:
 * pontos → saldo de rounds → confronto direto (vitórias entre os empatados)
 * → rounds vencidos → ordem manual definida pelo admin.
 */
export function computeStandings(
  teamIds: readonly string[],
  matches: readonly GroupMatchOutcome[],
  manualOrder: readonly string[] | null = null,
): StandingRow[] {
  const rows = new Map<string, MutableRow>(
    teamIds.map((teamId) => [teamId, {
      teamId, position: 0, played: 0, wins: 0, losses: 0, points: 0,
      roundsWon: 0, roundsLost: 0, roundDiff: 0, tiedUnresolved: false,
    }]),
  );

  const finished = matches.filter((m) => m.status === 'finished' && m.winnerId);
  for (const m of finished) {
    const sides = [
      { id: m.team1Id, own: m.team1Score ?? 0, other: m.team2Score ?? 0 },
      { id: m.team2Id, own: m.team2Score ?? 0, other: m.team1Score ?? 0 },
    ];
    for (const side of sides) {
      const row = rows.get(side.id);
      if (!row) continue;
      const won = m.winnerId === side.id;
      row.played++;
      row.roundsWon += side.own;
      row.roundsLost += side.other;
      if (won) {
        row.wins++;
        row.points += POINTS_WIN;
      } else {
        row.losses++;
        row.points += m.walkover ? POINTS_WALKOVER_LOSS : POINTS_LOSS;
      }
    }
  }
  for (const row of rows.values()) row.roundDiff = row.roundsWon - row.roundsLost;

  const originalIndex = new Map(teamIds.map((id, i) => [id, i]));
  const sorted = [...rows.values()].sort(
    (a, b) => b.points - a.points || b.roundDiff - a.roundDiff ||
      originalIndex.get(a.teamId)! - originalIndex.get(b.teamId)!,
  );

  const ordered: MutableRow[] = [];
  for (const cluster of clusters(sorted, (r) => `${r.points}|${r.roundDiff}`)) {
    ordered.push(...breakTie(cluster, finished, manualOrder));
  }

  ordered.forEach((row, i) => { row.position = i + 1; });
  return ordered;
}

/** Empate em aberto que decide quem passa ou quem é 1º/2º trava o mata-mata. */
export function hasBlockingTie(rows: readonly StandingRow[]): boolean {
  return rows.some((r) => r.tiedUnresolved && r.position <= 2);
}

function breakTie(
  cluster: MutableRow[],
  finished: readonly GroupMatchOutcome[],
  manualOrder: readonly string[] | null,
): MutableRow[] {
  if (cluster.length === 1) return cluster;

  const members = new Set(cluster.map((r) => r.teamId));
  const h2hWins = new Map(cluster.map((r) => [r.teamId, 0]));
  for (const m of finished) {
    if (members.has(m.team1Id) && members.has(m.team2Id) && m.winnerId) {
      h2hWins.set(m.winnerId, (h2hWins.get(m.winnerId) ?? 0) + 1);
    }
  }

  const byCriteria = [...cluster].sort(
    (a, b) => h2hWins.get(b.teamId)! - h2hWins.get(a.teamId)! || b.roundsWon - a.roundsWon,
  );

  const result: MutableRow[] = [];
  for (const tied of clusters(byCriteria, (r) => `${h2hWins.get(r.teamId)}|${r.roundsWon}`)) {
    if (tied.length === 1) {
      result.push(...tied);
      continue;
    }
    const manualIndex = new Map((manualOrder ?? []).map((id, i) => [id, i]));
    if (tied.every((r) => manualIndex.has(r.teamId))) {
      result.push(...tied.sort((a, b) => manualIndex.get(a.teamId)! - manualIndex.get(b.teamId)!));
      continue;
    }
    for (const r of tied) r.tiedUnresolved = true;
    result.push(...tied);
  }
  return result;
}

/** Agrupa itens consecutivos com a mesma chave. */
function clusters<T>(items: readonly T[], keyOf: (item: T) => string): T[][] {
  const out: T[][] = [];
  for (const item of items) {
    const last = out[out.length - 1];
    if (last && keyOf(last[0]) === keyOf(item)) last.push(item);
    else out.push([item]);
  }
  return out;
}
