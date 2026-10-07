#!/usr/bin/env node
/**
 * Deploy da Copa Nova Era. Cada pasta tem seu proprio firebase.json, entao
 * cada alvo roda com o cwd certo. Publicacao em producao sempre passa por
 * uma confirmacao, a menos que venha --yes (uso em CI).
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Passos de cada alvo, na ordem em que precisam rodar. */
const ALVOS = {
  site: {
    titulo: 'Site (Angular + Firebase Hosting)',
    passos: [
      { cwd: 'site', cmd: 'npm run build' },
      { cwd: 'site', cmd: 'firebase deploy --only hosting' },
    ],
  },
  api: {
    titulo: 'API (Cloud Functions)',
    // lint e build vem do predeploy declarado em api2/firebase.json.
    passos: [{ cwd: 'api2', cmd: 'firebase deploy --only functions' }],
  },
  rules: {
    titulo: 'Regras e indices (Firestore + Storage)',
    passos: [
      { cwd: 'api2', cmd: 'firebase deploy --only firestore:rules,firestore:indexes,storage' },
    ],
  },
};

ALVOS.all = {
  titulo: 'Tudo: site, API e regras',
  passos: [...ALVOS.site.passos, ...ALVOS.api.passos, ...ALVOS.rules.passos],
};

ALVOS.preview = {
  titulo: 'Preview do site em canal temporario (nao toca em producao)',
  producao: false,
  passos: [
    { cwd: 'site', cmd: 'npm run build' },
    { cwd: 'site', cmd: 'firebase hosting:channel:deploy preview' },
  ],
};

function projetoFirebase(pasta) {
  try {
    const rc = JSON.parse(readFileSync(join(raiz, pasta, '.firebaserc'), 'utf8'));
    return rc.projects?.default ?? '(desconhecido)';
  } catch {
    return '(desconhecido)';
  }
}

function executar(passo) {
  return new Promise((resolvePromise, reject) => {
    const filho = spawn(passo.cmd, { cwd: join(raiz, passo.cwd), stdio: 'inherit', shell: true });
    filho.on('error', reject);
    filho.on('close', (codigo) =>
      codigo === 0
        ? resolvePromise()
        : reject(new Error(`"${passo.cmd}" (em ${passo.cwd}) saiu com codigo ${codigo}`)),
    );
  });
}

async function confirmar(pergunta) {
  if (!process.stdin.isTTY) {
    console.error('Sem terminal interativo para confirmar. Use --yes para publicar assim mesmo.');
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resposta = (await rl.question(`${pergunta} [s/N] `)).trim().toLowerCase();
  rl.close();
  return resposta === 's' || resposta === 'sim' || resposta === 'y' || resposta === 'yes';
}

const argumentos = process.argv.slice(2);
const pular = argumentos.includes('--yes') || argumentos.includes('-y');
const nome = argumentos.find((arg) => !arg.startsWith('-')) ?? 'site';
const alvo = ALVOS[nome];

if (!alvo) {
  console.error(`Alvo desconhecido: "${nome}". Use um de: ${Object.keys(ALVOS).join(', ')}.`);
  process.exit(1);
}

console.log(`\nAlvo:    ${alvo.titulo}`);
console.log(`Projeto: ${projetoFirebase('site')}`);
console.log('Passos:');
for (const passo of alvo.passos) console.log(`  - ${passo.cwd}: ${passo.cmd}`);
console.log('');

const ehProducao = alvo.producao !== false;
if (ehProducao && !pular && !(await confirmar('Publicar em PRODUCAO?'))) {
  console.log('Cancelado. Nada foi publicado.');
  process.exit(1);
}

for (const passo of alvo.passos) {
  console.log(`\n> [${passo.cwd}] ${passo.cmd}`);
  try {
    await executar(passo);
  } catch (erro) {
    console.error(`\nFalhou: ${erro.message}`);
    console.error('Deploy interrompido. Nenhum passo seguinte rodou.');
    process.exit(1);
  }
}

console.log('\nDeploy concluido.');
