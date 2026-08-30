# Teste E2E — Check-in de time no torneio

Data da execução: 24/08/2026
Ambiente: front-end `http://localhost:4200`, emulador Firebase em `http://127.0.0.1:5001/copa-nova-era-overwatch/southamerica-east1`
Branch: `feat/checkin-de-time-no-torneio`
Execução: Chrome (Claude in Chrome), somente teste — nenhum arquivo de código foi alterado.

## Resumo

| Cenário | Resultado |
|---|---|
| 1 — Capitão faz o próprio check-in | Passou |
| 2 — Membro comum não vê a ação | Passou |
| 3 — Admin inscreve um time manualmente | Passou |
| 4 — Admin remove um time | Passou |
| 5 — Torneio random é bloqueado | Passou |
| 6 — Prazo encerrado só bloqueia o capitão | Passou (com desvio: ver Bug 1) |

Todo o fluxo de check-in de time funcionou como especificado. Foram encontrados **1 bug** e **2 observações**, todos fora do fluxo de check-in em si (edição de torneio e listagem de times disponíveis).

## Desvio das pré-condições do roteiro

A conta de capitão indicada no roteiro (`dangus@home.local` / `Teste123!`) **não existe** neste ambiente:

- `/watchpoint/usuarios` lista 3 usuários: `user@home.local` (competidor), `streamer@home.local` (streamer), `ronaldo@home.local` (admin).
- `POST /auth/login` com `dangus@home.local` retorna `401 {"error":"Credenciais invalidas."}`.

Por orientação do solicitante, os papéis foram mapeados assim:

- **Capitão**: `user@home.local` (Ronaldo User, `user#123123`)
- **Membro comum**: `streamer@home.local` (Ronaldo Streamer, `streamer#1231`)
- **Admin**: `ronaldo@home.local` (Ronaldo Hoch)

## Dados criados para o teste

- Torneio **E2E Checkin Fechado** — id `8Y0wdkpdYtexkN2gPbvk`, `teamMode: closed`, `maxTeams: 8`, `startAt: 30/09/2026 20:00`, status final `checkin`, `checkinDeadlineAt` deixado **no passado** (01/08/2026 20:00) por causa do cenário 6.
- **Novo time 1** (`IDndRPHaxKZJLneH4ry8`) — capitão Ronaldo User, membro Ronaldo Streamer. Inscrito no torneio.
- **Novo time 2** (`ZJHIdr2JdbT4RHXQ0r7c`) — capitão Ronaldo User, membro Ronaldo Streamer. Não inscrito.
- **Trick shot** — inscrito no torneio pelo admin ao final do cenário 6.

O torneio pré-existente **Nova Era - Primeira Edição** (`xD3cLnQMNxpv4knH81xV`, random, em andamento) foi usado só como leitura no cenário 5.

---

## Cenário 1 — Capitão faz o próprio check-in — PASSOU

Login como `user@home.local`, `/watchpoint/times` exibiu apenas "Novo time 1" ("Exibindo apenas os times que você participa").

No detalhe do time, o card **"Check-in em torneios"** apareceu com o subtítulo "Torneios de times fechados com o check-in aberto. Somente o capitão do time ou um admin pode confirmar a participação." e a linha:

```
E2E CHECKIN FECHADO
Check-in aberto
Início: 30/09/2026, 20:00 / Check-in até: 29/09/2026, 20:00   [FAZER CHECK-IN]
```

Após clicar em "Fazer check-in":

- mensagem verde **"Check-in realizado em E2E Checkin Fechado."**;
- a lista de disponíveis passou a mostrar "Nenhum torneio com check-in aberto para este time no momento.";
- em **"Torneios em que participa"** apareceu:
  ```
  E2E CHECKIN FECHADO
  Check-in aberto / Times fechados, Check-in realizado
  Check-in feito por Ronaldo User (capitão)
  Início: 30/09/2026, 20:00
  ```

Nenhum erro no console.

## Cenário 2 — Membro comum não vê a ação — PASSOU

Testado de forma decisiva com **Novo time 2** (time ainda **não inscrito**, torneio com check-in aberto e prazo no futuro no momento do teste), para que a ausência do card não pudesse ser explicada pelo check-in já realizado.

Login como `streamer@home.local` (membro, não capitão) e abrindo `/watchpoint/time/ZJHIdr2JdbT4RHXQ0r7c/detalhe`:

- o card **"Check-in em torneios" não é renderizado**;
- o botão "Promover para capitão" também não aparece para o membro comum;
- as seções visíveis são apenas Integrantes, "Torneios em que participa", "Torneios em que participou", Troféus e "Sair do time".

O mesmo comportamento foi observado em Novo time 1 já com check-in feito.

## Cenário 3 — Admin inscreve um time manualmente — PASSOU

`/watchpoint/torneios` mostra a ação **"Times do torneio"** apenas no card do torneio `closed` (o torneio random não expõe esse link na listagem).

Cabeçalho da página `/watchpoint/torneios/8Y0wdkpdYtexkN2gPbvk/times`:

```
E2E Checkin Fechado
Check-in aberto / Times fechados
Check-in até: 29/09/2026, 20:00
1/8 vagas preenchidas
```

Em "Times inscritos", o time do cenário 1 apareceu com **"Check-in por: Ronaldo User (capitão) em 24/08/2026, 08:21"**.

Busca em "Adicionar time ao torneio":

- `trick` → filtra para "TRICK SHOT";
- `Ronaldo Hoch` (capitão) → filtra para "TIME RANDOM 1", "TIME RANDOM 2" e "TRICK SHOT".

Ao clicar em "Adicionar ao torneio" no Trick shot:

- mensagem verde **"Trick shot adicionado ao torneio com check-in."**;
- o time saiu da lista de disponíveis ("Nenhum time disponível para adicionar." com o filtro `trick`);
- entrou em "Times inscritos" com **"Check-in por: Ronaldo Hoch (admin) em 24/08/2026, 08:24"**;
- contador subiu de **1/8 para 2/8 vagas preenchidas**.

## Cenário 4 — Admin remove um time — PASSOU

Clicando em "Remover do torneio" no Trick shot:

- mensagem verde **"Trick shot removido do torneio."**;
- o time saiu de "Times inscritos" e voltou para a lista de disponíveis;
- contador desceu de **2/8 para 1/8 vagas preenchidas**.

## Cenário 5 — Torneio random é bloqueado — PASSOU

Acessando direto `/watchpoint/torneios/xD3cLnQMNxpv4knH81xV/times`:

- cabeçalho com o aviso em vermelho **"Este torneio usa times sorteados. Os times são formados pelo sorteio, e não por check-in de time."**;
- a seção **"Adicionar time ao torneio" não é renderizada** (confirmado por leitura da árvore de acessibilidade: não existe nem a seção nem o campo "Buscar time");
- apenas "Times inscritos" é exibido, com botões "Remover do torneio".

## Cenário 6 — Prazo encerrado só bloqueia o capitão — PASSOU (com desvio)

Para colocar `checkinDeadlineAt` no passado foi preciso contornar o Bug 1 abaixo: o torneio foi levado a `draft`, editado (01/08/2026 20:00) e devolvido a `checkin`.

Com o prazo encerrado:

- **Capitão** (`user@home.local`) em Novo time 2 (não inscrito): o card "Check-in em torneios" aparece, mas com **"Nenhum torneio com check-in aberto para este time no momento."** — o torneio não é listado. Correto.
- **Admin**: em `/watchpoint/torneios/8Y0wdkpdYtexkN2gPbvk/times` o cabeçalho mostra "Check-in até: 01/08/2026, 20:00" e a adição manual **continua funcionando** — "Trick shot adicionado ao torneio com check-in.", contador 1/8 → 2/8, check-in atribuído a "Ronaldo Hoch (admin)".

Isso bate com a regra do backend (`torneios.service.ts:536-547`): a checagem de prazo e de status só roda no ramo `else` (não-admin).

---

## Bug 1 — Edição de torneio fora de `draft` ignora datas e maxTeams, mas diz "atualizado com sucesso"

**Severidade:** média (leva o admin a acreditar que salvou algo que não foi salvo).

**Como reproduzir:**

1. Com o torneio em status `checkin` (ou qualquer status diferente de `draft`), abrir `/watchpoint/torneios/<id>/editar`.
2. Alterar "Fim do check-in" de 29/09/2026 20:00 para 01/08/2026 20:00.
3. Clicar em "Salvar alterações do torneio".

**Observado:** a tela exibe **"Torneio atualizado com sucesso."** e o campo permanece mostrando o novo valor, mas o dado não é persistido.

Confirmação direta na API (mesma resposta pelo front-end e por chamada isolada):

```
PATCH /torneios/8Y0wdkpdYtexkN2gPbvk
body: {"checkinDeadlineAt":"2026-08-01T23:00:00.000Z"}
HTTP 200
resposta: ... "checkinDeadlineAt":"2026-09-29T23:00:00.000Z" ...   <-- valor antigo
```

**Causa:** `api2/functions/src/torneios/torneios.service.ts:193` — `const canEditCore = t.status === 'draft';`. `startAt`, `checkinDeadlineAt` e os slots de role só entram em `updateData` dentro de `if (canEditCore) { ... }` (linhas 209-223). Fora de `draft` os campos são descartados em silêncio e o método ainda retorna 200 com o documento inalterado.

**Sugestões:** ou o backend retorna erro quando vierem campos "core" e o torneio não está em `draft`, ou o front-end desabilita esses campos fora de `draft` e explica o motivo. Hoje o feedback verde é enganoso.

**Workaround usado no teste:** status → `draft` → editar → status → `checkin` (o admin pode forçar qualquer transição, `setStatus(..., byAdmin = true)`).

## Observação 1 — Times sem capitão aparecem como disponíveis e só falham no clique

Na página "Times do torneio", a lista "Adicionar time ao torneio" inclui times sem capitão (ex.: "NOVO TIME 3 — Capitão: Sem capitao definido / 0 integrante(s)"). Ao clicar em "Adicionar ao torneio" a operação falha com a mensagem vermelha **"Este time nao possui capitao no momento"** (`torneios.service.ts:571`, a regra existe porque o troféu é atribuído ao capitão).

A regra parece intencional, mas o time não deveria ser oferecido como adicionável — ou o botão deveria vir desabilitado com a explicação. Note que a mensagem de erro é renderizada no topo da página (junto ao cabeçalho do torneio), longe do botão que a originou.

## Observação 2 — Dados legados do torneio random exibem placeholders

Em `/watchpoint/torneios/xD3cLnQMNxpv4knH81xV/times`, os 8 times inscritos aparecem como **"TIME SEM NOME"**, "Time criado no torneio / 0 integrante(s)" e **"Check-in por: Não informado em Não informado"**. É consistente com times criados pelo sorteio antes deste recurso existir (sem `checkedInByName`/`checkedInByRole`), mas vale decidir se essa tela deve exibir um texto neutro em vez de "Não informado em Não informado".

---

## Notas de execução

- Nenhum erro de JavaScript foi observado no console durante os fluxos testados.
- A captura de rede da extensão não conseguiu isolar as chamadas `POST|DELETE /torneios/:id/teams/:teamId/checkin` (o log da aba retorna apenas as capturas de tela em `data:`); todas as evidências de API neste relatório vieram de chamadas diretas ao emulador com `curl`. Como todos os cenários passaram, não houve corpo de erro HTTP a registrar — a única falha de API investigada foi a do Bug 1, documentada acima.
- O ambiente ficou com o estado descrito em "Dados criados para o teste"; em especial, **o torneio E2E Checkin Fechado está com o prazo de check-in no passado** e com 2 times inscritos.
