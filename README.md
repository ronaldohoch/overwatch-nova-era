# Overwatch Nova Era

Plataforma de gerenciamento de torneios de Overwatch — com sistema de brackets, times, trofeus e painel para streamers.

## Estrutura do repositório

```
overwatch-nova-era/
├── site/       # Frontend — Angular 21 + SSR + Tailwind CSS v4
└── api2/       # Backend — Firebase Cloud Functions + Express + TypeScript
```

---

## Pré-requisitos

- **Node.js 24** (exigido pelo backend)
- **npm**
- **Firebase CLI**: `npm install -g firebase-tools`
- Acesso ao projeto Firebase (solicite ao responsável)

---

## Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd overwatch-nova-era
```

### 2. Frontend (site/)

```bash
cd site
npm install
```

Crie o arquivo de environment de desenvolvimento se ainda não existir:

```
site/src/environments/environment.development.ts
```

Preencha as URLs das APIs conforme o ambiente local ou emulador:

```ts
export const environment = {
  production: false,
  apiURLAuth:     'http://localhost:5001/<projeto>/southamerica-east1/auth',
  apiURLTorneios: 'http://localhost:5001/<projeto>/southamerica-east1/torneios',
  apiURLTimes:    'http://localhost:5001/<projeto>/southamerica-east1/times',
  apiURLTrofeus:  'http://localhost:5001/<projeto>/southamerica-east1/trofeus',
  apiURLBrackets: 'http://localhost:5001/<projeto>/southamerica-east1/brackets',
};
```

### 3. Backend (api2/functions/)

```bash
cd api2/functions
npm install
```

Configure as credenciais do Firebase (Application Default Credentials ou `serviceAccountKey.json`) conforme o ambiente.

---

## Rodando localmente

### Backend — emuladores Firebase

A partir de `api2/functions/`:

```bash
npm run emulator
```

Inicia o compilador TypeScript em modo watch e os emuladores Firebase:

| Serviço   | Porta |
|-----------|-------|
| Functions | 5001  |
| Firestore | 8080  |
| Storage   | 9199  |

Os dados do emulador ficam em `api2/emulator-data/` e são importados/exportados automaticamente.

### Frontend — servidor de desenvolvimento

A partir de `site/`:

```bash
npm start
```

Acesse em `http://localhost:4200`. O Angular detecta automaticamente o environment de desenvolvimento e aponta para os emuladores.

---

## Build e deploy

### Frontend

```bash
cd site

# Build de producao
npm run build

# Build + deploy para o Firebase Hosting
npm run build-deploy
```

### Backend

```bash
cd api2/functions

# O predeploy executa lint + build automaticamente
npm run deploy
```

---

## Scripts disponíveis

### site/

| Comando                  | Descricao                         |
|--------------------------|-----------------------------------|
| `npm start`              | Servidor de desenvolvimento       |
| `npm run build`          | Build de producao                 |
| `npm run build-deploy`   | Build + deploy Firebase Hosting   |
| `npm run watch`          | Build dev em modo watch           |
| `npm run serve:ssr:site` | Roda o servidor SSR compilado     |

### api2/functions/

| Comando             | Descricao                               |
|---------------------|-----------------------------------------|
| `npm run emulator`  | tsc watch + emuladores Firebase         |
| `npm run build`     | Compila TypeScript para `lib/`          |
| `npm run lint`      | Executa ESLint                          |
| `npm run deploy`    | Deploy das Cloud Functions              |
| `npm run logs`      | Exibe logs das Functions em producao    |

---

## Arquitetura

### Frontend

- **Angular 21** com SSR (Express), deteccao de mudancas zoneless, Signals API
- **Tailwind CSS v4** sem CSS scoped — estilos inline nos componentes
- Rotas lazy-loaded em `site/src/app/features/`
- Biblioteca de componentes compartilhados em `site/src/app/shared/`
- Autenticacao via JWT — interceptor adiciona `Authorization: Bearer {token}` em todas as requisicoes

### Backend

- **Firebase Cloud Functions v7** + Express.js, regiao `southamerica-east1`
- Cada modulo em `api2/functions/src/{modulo}/`:
  - `{modulo}.functions.ts` — rotas Express
  - `{modulo}.service.ts` — logica de negocio (singleton)
  - `interfaces/index.ts` — tipos do modulo

**Modulos:**

| Modulo     | Descricao                                                       |
|------------|-----------------------------------------------------------------|
| `auth`     | Login, registro, reset de senha (email via Resend)              |
| `torneios` | CRUD de torneios, transicoes de status, participantes           |
| `times`    | CRUD de times, convites de membros, check-in no torneio         |
| `brackets` | Geracao de chaves (4/8/16/32 times), report de resultados       |
| `trofeus`  | Sistema de trofeus e premiacoes                                 |

**Estrutura Firestore:**

```
tournaments/{id}
  ├── participants/
  └── teams/

brackets/{tournamentId}
  └── matches/{matchNumber}

teams/{id}
  ├── members/
  └── invites/
```

---

## Regras de negocio

- Status do torneio: `draft → published → checkin → locked → running → finished | canceled`
- Brackets so podem ser gerados quando `status === 'running'`
- `maxTeams` deve ser potencia de 2: 4, 8, 16 ou 32
- `teamMode: 'random'` — sorteio de times no lock; `teamMode: 'closed'` — times pre-formados com check-in
- Para reportar resultado de uma partida, `winnerId` e obrigatorio (placar e opcional)

---

## Como contribuir

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/minha-feature
   ```

2. Siga os padroes do projeto:
   - Componentes Angular: standalone, `OnPush`, signals, sem CSS scoped
   - Backend: siga o padrao de modulo existente (`functions` + `service` + `interfaces`)
   - Use os CSS custom properties (`var(--ow-orange)`, `var(--ow-blue)`, etc.) para cores

3. Verifique o lint antes de abrir o PR:
   ```bash
   # Backend
   cd api2/functions && npm run lint
   ```

4. Abra um **Pull Request** para `main` com descricao clara do que foi feito e por que.

5. PRs com mudancas no backend devem incluir teste manual via emulador. PRs com novos componentes devem adicionar o componente ao `design-system` para visualizacao.
