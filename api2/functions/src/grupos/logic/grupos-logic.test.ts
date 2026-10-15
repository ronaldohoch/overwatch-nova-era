import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { assertValidGroups, groupLetter, groupSizes, splitIntoGroups } from './group-split';
import { roundRobin } from './round-robin';
import { computeStandings, GroupMatchOutcome, hasBlockingTie } from './standings';
import { buildKnockoutPositions, QualifiedTeam, rankQualifiers, standardSeedOrder } from './knockout-seeding';

// ── Divisão ─────────────────────────────────────────────────

test('groupSizes completa com grupos de 3', () => {
  assert.deepEqual(groupSizes(6), [3, 3]);
  assert.deepEqual(groupSizes(7), [4, 3]);
  assert.deepEqual(groupSizes(8), [4, 4]);
  assert.deepEqual(groupSizes(9), [3, 3, 3]);
  assert.deepEqual(groupSizes(10), [4, 3, 3]);
  assert.deepEqual(groupSizes(11), [4, 4, 3]);
  assert.deepEqual(groupSizes(15), [4, 4, 4, 3]);
  assert.deepEqual(groupSizes(64).length, 16);
});

test('groupSizes recusa menos de 6 e mais de 64 times', () => {
  assert.throws(() => groupSizes(5), /pelo menos 6/);
  assert.throws(() => groupSizes(65), /no máximo 64/);
});

test('splitIntoGroups corta na ordem recebida', () => {
  assert.deepEqual(
    splitIntoGroups(['a', 'b', 'c', 'd', 'e', 'f', 'g']),
    [['a', 'b', 'c', 'd'], ['e', 'f', 'g']],
  );
  assert.equal(groupLetter(0), 'A');
  assert.equal(groupLetter(3), 'D');
});

test('assertValidGroups aceita qualquer ordem de tamanhos e recusa divisão errada', () => {
  assert.doesNotThrow(() => assertValidGroups([['a', 'b', 'c'], ['d', 'e', 'f', 'g']]));
  assert.throws(() => assertValidGroups([['a', 'b'], ['c', 'd', 'e', 'f', 'g']]), /tamanhos 4, 3/);
  assert.throws(() => assertValidGroups([['a', 'b', 'c'], ['a', 'e', 'f']]), /mais de um grupo/);
});

// ── Todos contra todos ──────────────────────────────────────

test('roundRobin de 4 gera 3 rodadas de 2 jogos sem repetir confronto', () => {
  const fixtures = roundRobin(['a', 'e', 'i', 'm']);
  assert.deepEqual(
    fixtures.map((f) => `${f.round}:${f.team1Id}-${f.team2Id}`),
    ['1:a-m', '1:e-i', '2:a-i', '2:m-e', '3:a-e', '3:i-m'],
  );
});

test('roundRobin de 3 gera 3 rodadas de 1 jogo com folga', () => {
  const fixtures = roundRobin(['d', 'h', 'l']);
  assert.deepEqual(
    fixtures.map((f) => `${f.round}:${f.team1Id}-${f.team2Id}`),
    ['1:h-l', '2:d-l', '3:d-h'],
  );
});

// ── Classificação ───────────────────────────────────────────

function played(team1Id: string, team2Id: string, s1: number, s2: number, walkover = false): GroupMatchOutcome {
  return {
    team1Id, team2Id, team1Score: s1, team2Score: s2,
    winnerId: s1 > s2 ? team1Id : team2Id, walkover, status: 'finished',
  };
}

test('vitória vale 3, derrota vale 1, W.O. perdido vale 0', () => {
  const rows = computeStandings(['a', 'b', 'c'], [
    played('a', 'b', 2, 1),
    played('a', 'c', 2, 0, true),
  ]);
  const byId = new Map(rows.map((r) => [r.teamId, r]));
  assert.equal(byId.get('a')!.points, 6);
  assert.equal(byId.get('b')!.points, 1);
  assert.equal(byId.get('c')!.points, 0);
  assert.equal(byId.get('a')!.roundDiff, 3);
});

test('partida pendente não conta', () => {
  const rows = computeStandings(['a', 'b'], [{
    team1Id: 'a', team2Id: 'b', team1Score: null, team2Score: null,
    winnerId: null, walkover: false, status: 'pending',
  }]);
  assert.ok(rows.every((r) => r.played === 0 && r.points === 0));
});

test('empate em pontos é decidido pelo saldo de rounds', () => {
  // a e b: 1 vitória e 1 derrota cada (4 pts). a ganhou de c por 3x0, b ganhou de c por 2x1.
  const rows = computeStandings(['b', 'a', 'c'], [
    played('a', 'b', 0, 2),
    played('a', 'c', 3, 0),
    played('b', 'c', 2, 1),
  ]);
  assert.deepEqual(rows.map((r) => r.teamId), ['b', 'a', 'c']);

  const rows2 = computeStandings(['a', 'b', 'c', 'd'], [
    played('a', 'c', 3, 0), played('b', 'c', 2, 1),
    played('a', 'd', 0, 2), played('b', 'd', 0, 2),
    played('a', 'b', 1, 2), played('c', 'd', 0, 2),
  ]);
  // d: 9 pts. a: 4 pts saldo +0 (3-0, 0-2, 1-2 → 4-4). b: 7 pts. c: 3 pts.
  assert.deepEqual(rows2.map((r) => r.teamId), ['d', 'b', 'a', 'c']);
});

test('pontos e saldo iguais: confronto direto decide', () => {
  // a e b com 4 pts e saldo 0; a venceu b.
  const rows = computeStandings(['b', 'a', 'c'], [
    played('a', 'b', 2, 1),
    played('c', 'a', 2, 1),
    played('b', 'c', 2, 1),
  ]);
  // Todos com 4 pts e saldo 0: triplo empate, cada um com 1 vitória no confronto direto.
  // Rounds vencidos: a=3, b=3, c=3 → segue empatado.
  assert.ok(rows.every((r) => r.tiedUnresolved));
  assert.equal(hasBlockingTie(rows), true);

  const rows2 = computeStandings(['b', 'a', 'c', 'd'], [
    played('a', 'b', 2, 1), played('a', 'c', 0, 2), played('a', 'd', 2, 1),
    played('b', 'c', 2, 1), played('b', 'd', 2, 1), played('c', 'd', 0, 2),
  ]);
  // a: 2V (7 pts) saldo 4-4=0. b: 2V (7 pts) saldo 5-4=+1 → b à frente pelo saldo.
  assert.deepEqual(rows2.slice(0, 2).map((r) => r.teamId), ['b', 'a']);
});

test('dois times iguais em pontos e saldo: quem venceu o confronto fica à frente', () => {
  // a e b: 7 pts, saldo +1. a venceu b. c: 7 pts, saldo +2.
  const rows = computeStandings(['b', 'a', 'c', 'd'], [
    played('a', 'b', 2, 1), played('c', 'a', 2, 1), played('a', 'd', 2, 1),
    played('b', 'c', 2, 1), played('b', 'd', 2, 1), played('c', 'd', 2, 0),
  ]);
  assert.deepEqual(rows.map((r) => r.teamId), ['c', 'a', 'b', 'd']);
  assert.equal(hasBlockingTie(rows), false);
});

test('ordem manual do admin resolve empate que sobrou', () => {
  const matches = [played('a', 'b', 2, 1), played('c', 'a', 2, 1), played('b', 'c', 2, 1)];
  const rows = computeStandings(['a', 'b', 'c'], matches, ['c', 'a', 'b']);
  assert.deepEqual(rows.map((r) => r.teamId), ['c', 'a', 'b']);
  assert.equal(hasBlockingTie(rows), false);
});

test('empate só entre 3º e 4º não trava o mata-mata', () => {
  const rows = computeStandings(['a', 'b', 'c', 'd'], [
    played('a', 'b', 2, 0), played('a', 'c', 2, 0), played('a', 'd', 2, 0),
    played('b', 'c', 2, 0), played('b', 'd', 2, 0), played('c', 'd', 2, 1),
  ]);
  assert.deepEqual(rows.map((r) => r.teamId), ['a', 'b', 'c', 'd']);
  assert.equal(hasBlockingTie(rows), false);
});

// ── Seeding do mata-mata ────────────────────────────────────

function q(teamId: string, group: string, groupPosition: 1 | 2, wins: number, played: number, roundDiff = 0): QualifiedTeam {
  return { teamId, group, groupPosition, wins, played, roundDiff, roundsWon: wins * 2 };
}

test('standardSeedOrder segue a ordem clássica', () => {
  assert.deepEqual(standardSeedOrder(4), [1, 4, 2, 3]);
  assert.deepEqual(standardSeedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
});

test('rankQualifiers usa aproveitamento, não pontos brutos', () => {
  const ranked = rankQualifiers([
    q('A1', 'A', 1, 2, 3), // 67%
    q('B1', 'B', 1, 2, 2), // 100% em grupo de 3
    q('A2', 'A', 2, 2, 3),
  ]);
  assert.deepEqual(ranked.map((t) => t.teamId), ['B1', 'A1', 'A2']);
});

test('3 grupos: chave de 8 com bye para os 2 melhores 1º colocados', () => {
  const positions = buildKnockoutPositions([
    q('A1', 'A', 1, 3, 3), q('A2', 'A', 2, 2, 3),
    q('B1', 'B', 1, 2, 2), q('B2', 'B', 2, 1, 2),
    q('C1', 'C', 1, 2, 2, 1), q('C2', 'C', 2, 1, 2),
  ]);
  assert.equal(positions.length, 8);
  assert.equal(positions.filter((p) => p === null).length, 2);

  // Byes enfrentam os seeds 1 e 2 (A1 com 100% e saldo; depois B1/C1 por saldo).
  const byePartners: string[] = [];
  for (let i = 0; i < 8; i += 2) {
    if (positions[i] === null) byePartners.push(positions[i + 1]!);
    if (positions[i + 1] === null) byePartners.push(positions[i]!);
  }
  assert.ok(byePartners.includes('A1'));
  assert.ok(byePartners.every((id) => id.endsWith('1')));
});

test('1ª rodada nunca repete confronto do mesmo grupo', () => {
  for (const groupCount of [2, 4, 8, 16]) {
    const teams: QualifiedTeam[] = [];
    for (let g = 0; g < groupCount; g++) {
      const letter = String.fromCharCode(65 + g);
      // 2º colocados ranqueados em ordem inversa para forçar choque com a ordem padrão.
      teams.push(q(`${letter}1`, letter, 1, 3, 3, groupCount - g));
      teams.push(q(`${letter}2`, letter, 2, 2, 3, g));
    }
    const positions = buildKnockoutPositions(teams);
    for (let i = 0; i < positions.length; i += 2) {
      const a = positions[i];
      const b = positions[i + 1];
      if (a && b) assert.notEqual(a[0], b[0], `${groupCount} grupos: ${a} x ${b}`);
    }
    // 1º sempre contra 2º.
    for (let i = 0; i < positions.length; i += 2) {
      assert.notEqual(positions[i]![1], positions[i + 1]![1]);
    }
  }
});
