# Drag and Drop de Seeds no Bracket

**Data:** 2026-04-04
**Escopo:** Backend (nova rota) + Frontend (CDK drag-drop na visualizacao do bracket)

## Resumo

Permitir que o admin reordene as posicoes dos times na Rodada 1 da Chave dos Vencedores de um bracket ja gerado, usando drag and drop (Angular CDK). A troca so e permitida em partidas que ainda nao foram reportadas.

## Backend

### Nova rota: `PATCH /brackets/:tournamentId/seeds`

**Arquivo:** `api2/functions/src/brackets/brackets.functions.ts`
**Auth:** admin only (`rolesMiddleware([UserRole.ADMIN])`)
**Body:**

```json
{
  "seedMap": { "1": "teamIdA", "2": "teamIdB", ... }
}
```

**Validacoes (em `brackets.service.ts`):**

1. Bracket existe e `status === 'running'`
2. Nenhuma partida da WB R1 (side `winners`, round 1) tem status `finished` ou `running`
3. O novo `seedMap` contem exatamente os mesmos teamIds do seedMap atual (apenas reordenados)
4. Tamanho do novo seedMap === `teamCount` do bracket

**Efeito:**

1. Atualiza `seedMap` no documento `brackets/{tournamentId}`
2. Para cada partida da WB R1: re-resolve `team1Id` e `team2Id` a partir dos novos seeds (slot1.ref e slot2.ref no seedMap)
3. Recalcula `status` de cada partida afetada (`ready` se ambos times presentes, `pending` caso contrario)
4. Tudo em um unico batch write do Firestore

**Metodo no service:** `updateSeeds(tournamentId: string, newSeedMap: Record<number, string>)`

### Rota no Express

```ts
app.patch(
  '/:tournamentId/seeds',
  requireAuth,
  rolesMiddleware([UserRole.ADMIN]),
  async (req, res) => { ... }
);
```

## Frontend

### Dependencia

Instalar `@angular/cdk` (mesmo major version do Angular 21).

### `brackets.service.ts` — novo metodo

```ts
async updateSeeds(tournamentId: string, seedMap: Record<number, string>): Promise<void>
```

Faz `PATCH` para `${apiURLBrackets}/${tournamentId}/seeds` com body `{ seedMap }`.

### `double-elimination.component.ts`

- Novo input: `canReorder = input(false)`
- Novo output: `seedSwapped = output<{ seed1: number; seed2: number }>()`
- Importar `CdkDragDrop`, `CdkDrag`, `CdkDropList` de `@angular/cdk/drag-drop`
- Na WB R1, cada slot de time e um `cdkDrag` dentro de um `cdkDropList` conectado aos demais slots da R1
- Ao dropar, calcula quais dois seeds foram trocados e emite `seedSwapped`
- Slots de partidas com status `finished` ou `running` nao sao draggable (`[cdkDragDisabled]="true"`)

### `double-elimination.component.html`

- Apenas na WB R1 (primeiro item de `wbRounds()`), os slots de time recebem diretivas CDK
- Visual durante drag: cursor `grab`/`grabbing`, leve destaque no slot de destino
- Indicador visual para o admin saber que pode arrastar (icone de grip ou cursor diferente)

### `torneio-bracket.component.ts`

- Passa `[canReorder]="isAdmin() && bracket()?.status === 'running'"` para `app-double-elimination`
- Escuta `(seedSwapped)` e:
  1. Constroi novo seedMap trocando os dois seeds
  2. Chama `bracketsService.updateSeeds(tournamentId, newSeedMap)`
  3. Recarrega o bracket com `getBracket()`
  4. Mostra feedback de sucesso/erro

## Restricoes

- Drag and drop **apenas** na Rodada 1 da Chave dos Vencedores
- **Apenas** partidas com status `pending` ou `ready` (sem resultado reportado)
- **Apenas** admin (nao streamer)
- O swap nao altera partidas de rounds subsequentes (R2+, losers bracket, grand final) — elas continuam dependendo dos `winner_of`/`loser_of`

## Fora de escopo

- Drag and drop no preview de criacao (ja funciona com checkbox + seeding service)
- Reordenar times em rodadas alem da R1
- Adicionar/remover times do bracket
