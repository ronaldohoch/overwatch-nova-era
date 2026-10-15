import { MatchTemplate } from './double-elimination.generator';

/**
 * Eliminação simples: perdeu, saiu.
 * R1 cruza as posições em pares (1x2, 3x4...), igual à chave dos vencedores
 * da dupla eliminação, e cada rodada seguinte junta os vencedores dois a dois.
 * A última partida é a final.
 */
export function generateSingleEliminationTemplate(teamCount: 4 | 8 | 16 | 32): MatchTemplate[] {
  const templates: MatchTemplate[] = [];
  let matchNumber = 1;

  let previousRound: number[] = [];
  for (let i = 0; i < teamCount / 2; i++) {
    templates.push({
      matchNumber,
      round: 1,
      side: 'winners',
      slot1: { type: 'seed', ref: i * 2 + 1 },
      slot2: { type: 'seed', ref: i * 2 + 2 },
    });
    previousRound.push(matchNumber++);
  }

  let round = 2;
  while (previousRound.length > 1) {
    const currentRound: number[] = [];
    for (let i = 0; i < previousRound.length; i += 2) {
      templates.push({
        matchNumber,
        round,
        side: 'winners',
        slot1: { type: 'winner_of', ref: previousRound[i] },
        slot2: { type: 'winner_of', ref: previousRound[i + 1] },
      });
      currentRound.push(matchNumber++);
    }
    previousRound = currentRound;
    round++;
  }

  return templates;
}
