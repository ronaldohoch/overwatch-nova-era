# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a monorepo with two independent projects:
- `site/` — Angular 21 frontend (SSR), deployed to Firebase Hosting
- `api2/` — Firebase Cloud Functions backend (Express + TypeScript), deployed to Google Cloud Run

The working directory for the frontend is `site/`. The backend lives at `api2/functions/`.

---

## Frontend (site/)

### Commands

```bash
# Dev server
npm start                   # ng serve (http://localhost:4200)

# Build
npm run build               # production build → dist/site/browser + dist/site/server
npm run watch               # dev build with watch

# Deploy
npm run build-deploy        # build + firebase deploy --only hosting

# SSR server (after build)
npm run serve:ssr:site      # node dist/site/server/server.mjs
```

No test runner is configured (ng test scaffold exists but not used).

### Architecture

Angular 20 with SSR (Express), Tailwind CSS v4, zoneless change detection, signals API.

**Feature routing** — all routes are lazy-loaded:
- `/` — landing page (`features/pagina-inicial/`)
- `/torneio`, `/torneios/:id` — tournament list & details (`features/torneio/`)
- `/watchpoint` — admin/streamer dashboard with child routes (`features/watchpoint/`)
- `/login`, `/reset-password` — auth pages (`features/login/`)
- `/design-system` — component showcase (`features/design-system/`)

**Auth** — `app.config.ts` registers an HTTP interceptor that reads the JWT from `AuthService.token()` (signal) and adds `Authorization: Bearer {token}` to requests.

**API base URLs** — injected from `src/environments/environment.ts` (prod) or `environment.development.ts` (dev). Each backend microservice has its own URL key: `apiURLAuth`, `apiURLTorneios`, `apiURLTimes`, `apiURLTrofeus`, `apiURLBrackets`.

### Shared Component Library (`src/app/shared/`)

All components are standalone, `OnPush`, signal-based, Tailwind-only (no scoped CSS). Colors use CSS custom properties (`var(--ow-orange)`, `var(--ow-blue)`, `var(--ow-gray-*)`), defined in `src/styles.css`.

Form controls (`ow-input`, `ow-textarea`, `ow-select`, `ow-radio-group`, `ow-checkbox`, `ow-toggle`) implement `ControlValueAccessor` (CVA) and work with Angular's reactive forms.

---

## Backend (api2/functions/)

### Commands

```bash
# From api2/functions/
npm run build               # tsc compile → lib/
npm run lint                # eslint

# Full local dev (from api2/functions/)
npm run emulator            # starts tsc --watch + Firebase emulators on ports:
                            #   5001 (functions), 8080 (Firestore), 9199 (storage)

# Deploy
npm run deploy              # firebase deploy --only functions
                            # predeploy: lint + build (defined in api2/firebase.json)
```

The emulator imports/exports from `api2/emulator-data/`.

### Architecture

Each feature is a self-contained module under `src/{module}/`:
- `{module}.functions.ts` — Express router, exported as a named Cloud Function
- `{module}.service.ts` — business logic, exported as a singleton (`export const {module}Svc = new {Module}Service()`)
- `interfaces/index.ts` — types for the module

All modules are re-exported from `src/index.ts`. Error handling uses `resolveErrorStatus` / `resolveErrorMessage` from `src/_config/errors`.

**Auth middleware** — `src/_middlewares/authMiddleware.ts` — validates JWT and attaches user to `req.user`. Roles: `competidor | streamer | admin`.

**Modules:**
| Module | Description |
|---|---|
| `auth` | Login, register, password reset (email via Resend) |
| `torneios` | Tournament CRUD, status transitions, participant management |
| `times` | Team CRUD, member invites, tournament check-in |
| `brackets` | Bracket generation (4/8/16/32 teams), match reporting with automatic propagation |
| `trofeus` | Trophy/awards system |

**Firestore structure:**
- `tournaments/{id}` → subcollections: `participants/`, `teams/`
- `brackets/{tournamentId}` → subcollection: `matches/{matchNumber}`
- `teams/{id}` → subcollections: `members/`, `invites/`

---

## Key Business Rules

- Tournament status flow: `draft → published → checkin → locked → running → finished | canceled`
- Brackets can only be generated when tournament `status === 'running'`
- `maxTeams` must be a power of 2: 4, 8, 16, or 32
- `teamMode: 'random'` — lock-and-draw; `teamMode: 'closed'` — pre-formed teams with check-in
- Bracket `seedMode: 'manual' | 'random'`; `winnerId` required to report a match result
