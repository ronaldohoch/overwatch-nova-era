import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  applyResult,
  bracketSizeFor,
  buildMatches,
  EngineMatch,
  finalMatchNumber,
  findDeadSlots,
  templatesFor,
} from './bracket-engine';

function seedMapOf(size: number, empty: number[] = []): Record<number, string> {
  const map: Record<number, string> = {};
  for (let pos = 1; pos <= size; pos++) {
    if (!empty.includes(pos)) map[pos] = `t${pos}`;
  }
  return map;
}

function byNumber(matches: EngineMatch[], n: number): EngineMatch {
  const m = matches.find((x) => x.matchNumber === n);
  assert.ok(m, `partida ${n} existe`);
  return m;
}

/** Joga a chave inteira dando vitória sempre ao time 1. */
function playAll(type: 'single-elimination' | 'double-elimination', size: 4 | 8 | 16 | 32, empty: number[] = []) {
  const templates = templatesFor(type, size);
  const seedMap = seedMapOf(size, empty);
  const dead = findDeadSlots(templates, seedMap);
  const matches = buildMatches(templates, seedMap);

  for (let guard = 0; guard < 200; guard++) {
    const next = matches.find((m) => m.status === 'ready');
    if (!next) break;
    applyResult(matches, dead, next.matchNumber, {
      winnerId: next.team1Id!,
      team1Score: 2,
      team2Score: 0,
      walkover: false,
    });
  }

  return { templates, matches };
}

test('bracketSizeFor arredonda para a próxima chave suportada', () => {
  assert.equal(bracketSizeFor(4), 4);
  assert.equal(bracketSizeFor(6), 8);
  assert.equal(bracketSizeFor(10), 16);
  assert.equal(bracketSizeFor(32), 32);
  assert.throws(() => bracketSizeFor(33));
});

test('eliminação simples de 8 tem 7 partidas e a final é a 7', () => {
  const templates = templatesFor('single-elimination', 8);
  assert.equal(templates.length, 7);
  assert.equal(finalMatchNumber(templates), 7);
  assert.deepEqual(templates[4].slot1, { type: 'winner_of', ref: 1 });
  assert.deepEqual(templates[4].slot2, { type: 'winner_of', ref: 2 });
});

test('final da dupla eliminação de 8 é a grande final (14)', () => {
  assert.equal(finalMatchNumber(templatesFor('double-elimination', 8)), 14);
});

test('chave cheia começa com a R1 pronta e o resto pendente', () => {
  const matches = buildMatches(templatesFor('single-elimination', 8), seedMapOf(8));
  assert.deepEqual(
    matches.map((m) => m.status),
    ['ready', 'ready', 'ready', 'ready', 'pending', 'pending', 'pending'],
  );
});

test('bye avança o time sozinho na eliminação simples', () => {
  const matches = buildMatches(templatesFor('single-elimination', 8), seedMapOf(8, [2, 8]));
  const m1 = byNumber(matches, 1);
  assert.equal(m1.status, 'finished');
  assert.equal(m1.bye, true);
  assert.equal(m1.winnerId, 't1');
  assert.equal(m1.loserId, null);
  assert.equal(byNumber(matches, 4).winnerId, 't7');
  assert.equal(byNumber(matches, 5).team1Id, 't1');
  assert.equal(byNumber(matches, 5).status, 'pending');
});

test('partida com os dois lados vazios propaga bye para a próxima', () => {
  const matches = buildMatches(templatesFor('single-elimination', 8), seedMapOf(8, [1, 2]));
  assert.equal(byNumber(matches, 1).winnerId, null);
  assert.equal(byNumber(matches, 1).status, 'finished');
  // M5 = W1 x W2: W1 nunca existe, então quem vencer M2 passa direto.
  assert.equal(byNumber(matches, 5).status, 'pending');
});

test('chave com bye na dupla eliminação termina sem partida travada', () => {
  for (const [size, empty] of [
    [8, [2, 8]],
    [8, [2]],
    [16, [2, 4, 6, 8, 10, 12]],
    [32, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28]],
  ] as const) {
    const { templates, matches } = playAll('double-elimination', size, [...empty]);
    const stuck = matches.filter((m) => m.status !== 'finished').map((m) => m.matchNumber);
    assert.deepEqual(stuck, [], `DE ${size} com byes ${empty.join(',')}`);
    assert.ok(byNumber(matches, finalMatchNumber(templates)).winnerId);
  }
});

test('chave com bye na eliminação simples termina sem partida travada', () => {
  for (const [size, empty] of [
    [8, [2, 8]],
    [16, [2, 4, 6, 8, 10, 12]],
  ] as const) {
    const { templates, matches } = playAll('single-elimination', size, [...empty]);
    const stuck = matches.filter((m) => m.status !== 'finished').map((m) => m.matchNumber);
    assert.deepEqual(stuck, []);
    assert.equal(byNumber(matches, finalMatchNumber(templates)).winnerId, 't1');
  }
});

test('perdedor de partida normal cai na chave dos perdedores', () => {
  const templates = templatesFor('double-elimination', 8);
  const seedMap = seedMapOf(8);
  const dead = findDeadSlots(templates, seedMap);
  const matches = buildMatches(templates, seedMap);

  applyResult(matches, dead, 1, { winnerId: 't2', team1Score: 1, team2Score: 2, walkover: false });
  const m1 = byNumber(matches, 1);
  assert.equal(m1.loserId, 't1');
  assert.equal(byNumber(matches, 5).team1Id, 't1');
  assert.equal(byNumber(matches, 7).team1Id, 't2');
});

test('não aceita resultado em partida sem os dois times', () => {
  const templates = templatesFor('single-elimination', 8);
  const seedMap = seedMapOf(8);
  const matches = buildMatches(templates, seedMap);
  assert.throws(
    () => applyResult(matches, findDeadSlots(templates, seedMap), 5, {
      winnerId: 't1', team1Score: null, team2Score: null, walkover: false,
    }),
    /pending/,
  );
});
