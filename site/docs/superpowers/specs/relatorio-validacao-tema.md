# Relatório — validação visual do tema claro/escuro

**Data:** 2026-08-23
**Escopo:** rotas públicas do frontend (`site/`), nos dois temas, em 1440×900 e 390×844.
**Método:** navegação e captura via Chrome MCP, com inspeção de estilos computados e medição de contraste por script.
**Base testada:** build de produção (`npm run build`) servido por `node dist/site/server/server.mjs` em `http://localhost:4000`.

Nada foi corrigido. Este documento apenas relata.

---

## Condições da execução

Quatro pontos que afetam a leitura dos resultados:

1. **O servidor em `:4000` estava servindo um build desatualizado.** O processo node havia subido às 22:42 e o conteúdo de `dist/` era das 22:54. O HTML renderizado no servidor ainda trazia classes anteriores ao refactor de tema (por exemplo `bg-white` nos cards da home, onde o fonte já usa `bg-(--ow-surface)`). O processo antigo foi encerrado, `npm run build` foi executado novamente e o servidor foi religado. **Toda a validação final foi feita nesse servidor, com o build atual.**

2. **O dev server em `:4200` também estava parcialmente desatualizado.** O bundle entregava `bg-[linear-gradient(135deg,#f06314_0%,#d14e0a_100%)]` em um trecho onde o fonte já tem `bg-[image:var(--gradient-orange)]`. Os achados obtidos nele foram descartados e refeitos em `:4000`.

3. **Viewport de 390 px.** O Chrome limita a largura mínima de janela em 500 px nesta máquina. As capturas de 390×844 foram feitas com um iframe same-origin dessa dimensão, o que faz o layout responder exatamente como em um viewport real desse tamanho.

4. **O script de contraste do prompt original produz falsos positivos.** A função `bgOf` retorna a cor semitransparente crua (`rgba(...)`) quando o fundo é um tint, e cai no `body` quando o fundo é `background-image` — o que faz textos brancos dentro do painel invertido aparecerem como "branco sobre branco, ratio 1". Os números deste relatório vêm de uma variante que compõe o alpha ao longo da cadeia de ancestrais até encontrar uma cor opaca.

---

## Problemas encontrados

### Severidade alta

#### 1. `logostg1.png` tem um fundo xadrez branco opaco gravado no arquivo

- **Onde:** rota `/`, no hero e na seção "Parceria"; também no hero mobile.
- **Temas:** ambos.
- **Evidência:** o pixel (2,2) da imagem é `rgb(254,254,254)` com alpha `255`. Não é transparência mal renderizada — o xadrez está no bitmap.
- **Efeito:** no tema escuro, um bloco branco de 320×320 px sobre `#111111`. No tema claro, o logo cai dentro do painel preto (`--ow-panel-invert`), então o bloco branco continua igualmente visível.
- **Observação:** é um problema de asset, não de tema. As outras imagens citadas na lista de risco (`logo-nova-era-low-res.webp`, `winston.webp`, `tracer-hero.webp`) estão corretas nos dois temas.

#### 2. Badge amarelo com texto quase branco — 1.53:1

- **Onde:** `/design-system` — "YELLOW" (seção Badges), "EM DISPUTA" (Tabela), "FLEX" (Role Badges e Team Cards).
- **Temas:** ambos.
- **Detalhe:** `#f1f3f4` sobre `#fbbc04`. Praticamente ilegível.

---

### Severidade média

#### 3. O link ativo do header nunca fica laranja

- **Onde:** header, todas as rotas.
- **Temas:** ambos.
- **Detalhe:** `routerLinkActive="text-(--ow-orange)"` é de fato aplicado — em `/`, `classList.contains('text-(--ow-orange)')` retorna `true` para o link "Início". Mesmo assim, a cor computada continua `rgb(154,160,166)`, ou seja `--ow-text-muted`. As duas classes têm a mesma especificidade e a utility base vem depois na folha de estilo do Tailwind, então ela vence. Só o sublinhado laranja diferencia o item ativo.
- **Hover funciona:** ao passar o mouse, a cor vira `rgb(240,99,20)`. Isso permite ver os dois estados lado a lado — "Início" ativo em cinza e "Quem é Nova Era?" em hover laranja.
- **Arquivo:** `src/app/core/header/components/links/links.component.html` / `.ts`.

#### 4. `--ow-text-subtle` reprova AA nos dois temas

| Tema | Valor | Sobre | Ratio |
|---|---|---|---|
| escuro | `#5f6368` | `#1a1a1a` (`--ow-surface`) | 2.88:1 |
| escuro | `#5f6368` | `#111111` (`--ow-bg`) | 3.12:1 |
| claro | `#9aa0a6` | `#ffffff` | 2.64:1 |

- **Onde:** placeholders de `ow-input` e `ow-textarea` (`placeholder:text-(--ow-text-subtle)`), rótulos da seção Tipografia do design system, labels do Divisor, texto "fim do design system".
- **Volume:** 14 ocorrências no escuro e 14 no claro, só em `/design-system`.
- **Arquivo:** `src/styles.css` linhas 71 e 136.

#### 5. Alerta de erro no tema escuro — 3.86:1

- `#ea4335` sobre o composto de `rgba(234,67,53,0.14)` em `#1a1a1a`. Abaixo do mínimo de 4.5 para texto normal.
- Aparece em produção em `/reset-password` ("Link invalido ou expirado…").
- As outras três variantes passam no escuro: informação 6.91, atenção 7.58, sucesso 4.69.

#### 6. Alerta de informação no tema claro — 3.06:1

- `#0099cc` sobre o composto de `rgba(0,195,255,0.08)` em branco.
- As outras três passam no claro: sucesso 4.72, atenção 4.65, erro 5.22.

#### 7. Cores da paleta usadas como cor de texto reprovam no tema claro

`--ow-orange` `#f06314` sobre branco dá **3.23:1**; o mesmo laranja sobre `#111111` dá 5.87:1 e passa. O problema é específico do tema claro.

- 21 ocorrências em `/design-system`, 19 em `/como-funciona`, 4 em `/quem-e-nova-era` — inclui "Copa Nova Era · 2026", os títulos "Links" e "Recursos" do rodapé, e as eyebrows "Nossa origem", "Trajetória", "O campeonato", "Parceria" da home.

O mesmo padrão atinge as demais cores da paleta sobre branco:

| Token | Valor | Ratio sobre branco |
|---|---|---|
| `--ow-blue` | `#00c3ff` | 2.05:1 |
| `--ow-green` | `#34a853` | 3.06:1 |
| `--ow-orange` | `#f06314` | 3.23:1 |
| `--ow-blue-dark` | `#0099cc` | 3.27:1 |
| `--ow-red` | `#ea4335` | 3.92:1 |

O caso mais visível é o prêmio "R$ 3.000" do pódio em `/torneio`, em azul claro sobre branco.

#### 8. Badges de cor sólida com texto branco reprovam AA, independente de tema

| Fundo | Ratio com texto branco |
|---|---|
| `#00c3ff` | 2.05:1 |
| `#9aa0a6` | 2.64:1 |
| `#34a853` | 3.06:1 |
| `#f06314` | 3.23:1 |
| `#ea4335` | 3.92:1 |

---

### Severidade baixa

#### 9. Toast e tooltip usam token bruto em vez de semântico

- `src/app/shared/design-system/toast/toast.component.ts:102` e `src/app/shared/design-system/tooltip/tooltip.component.ts:22` usam `bg-(--ow-gray-700)` (`#202124`).
- No tema escuro isso dá **1.18:1** contra a página (`#111111`) e **1.08:1** contra a superfície (`#1a1a1a`).
- Na prática ainda se distinguem — o `box-shadow`, o clip-path e o texto branco seguram a leitura —, mas a separação de superfície é praticamente nula e o efeito de "flutuar sobre a página" se perde.

#### 10. Botão de fechar do toast com `opacity-40`

Fica quase invisível nos dois temas. `toast.component.ts:71`.

#### 11. Botão de fechar dos alertas herda a cor da variante

Como usa a mesma cor do corpo sobre o mesmo fundo tingido, repete o ratio da variante: 3.06 no informação claro, 3.86 no erro escuro.

#### 12. Cabeçalho do bloco de código no tema claro — 2.42:1

"Angular Template" e "Copiar" em `#8c8fa1` sobre `#dce0e8`.

---

## Itens da lista de risco verificados e corretos

1. **Painel invertido da home** — correto nos dois temas. No escuro, `--ow-panel-invert: none` faz o fundo sumir e fundir com a página, sem emenda visível e sem nenhuma silhueta remanescente do clip-path; conferido no hero e no CTA final, em 1440 e em 390. No claro, renderiza como bloco preto com gradiente e cantos cortados sobre a página branca, conforme especificado.

2. **Imagens sobre fundo escuro** — `winston.webp`, `tracer-hero.webp` e `logo-nova-era-low-res.webp` estão limpas nos dois temas: sem halo branco, sem borda serrilhada e sem sumir no preto. O único problema é `logostg1.png` (item 1).

3. **Overlay de modal** — correto nos dois temas. No escuro (`rgba(0,0,0,0.6)`) e no claro (`rgba(17,17,17,0.35)`), o conteúdo atrás escurece. Nenhum dos dois clareia. Verificado abrindo o modal de `/design-system` em cada tema e comparando o brilho dos botões laranja ao fundo.

4. **Alertas** — as quatro variantes aparecem e são legíveis nos dois temas; nenhuma sumiu no fundo tingido. Duas ficam abaixo de AA (itens 5 e 6), mas continuam visíveis.

5. **Toast e tooltip** — continuam distinguíveis do fundo; não viraram um borrão só. A margem é apertada (item 9).

6. **Formulários** — input, textarea, select, checkbox, radio e toggle verificados nos dois temas. Foco (borda laranja mais halo `rgba(240,99,20,0.12)`), erro (borda e texto vermelhos), sucesso (verde) e desabilitado (esmaecido) funcionam corretamente. O placeholder herda o problema do item 4.

7. **Bloco de código** — a troca de tema acontece: Catppuccin Latte (`#eff1f5`) no claro e Mocha (`#1e1e2e`, texto `#cdd6f4`) no escuro.

8. **Swatches de cor** — 17 de 17 conferidos por script, comparando o `backgroundColor` computado da amostra com o rótulo hexadecimal ao lado. Todos batem.

9. **Links do header** — legíveis em repouso nos dois temas; o hover fica laranja corretamente. O estado ativo não fica laranja (item 3).

10. **Flash ao carregar** — o HTML renderizado no servidor já vem com `data-theme="dark"` no `<html>`, e há um script inline bloqueante no `<head>` que lê `localStorage['ow-theme']` antes do primeiro paint. Uma captura feita imediatamente após a navegação, com tema escuro salvo, não mostra nenhuma piscada branca.

11. **Persistência** — trocar pelo botão do rodapé grava em `localStorage`, e o tema sobrevive a um reload completo e à troca de rota (`/como-funciona` → `/regras`, com `bodyBg` permanecendo `rgb(255,255,255)`).

12. **Bracket** — cards de partida, tint laranja do vencedor, placares e pódio são legíveis nos dois temas. Não existem linhas conectoras entre as rodadas — não há nenhum elemento de conector no DOM, em tema nenhum. Portanto não é uma regressão de tema, e sim uma funcionalidade ausente.

---

## Não coberto

`/watchpoint/*` exige login. Sem credenciais disponíveis, não foi testado, e nenhuma tentativa de contornar a autenticação foi feita.

---

## Contraste — resumo das falhas

Contagem de elementos abaixo de WCAG AA, por rota e tema, já descontados os falsos positivos:

| Rota | Escuro | Claro |
|---|---|---|
| `/` | 2 | 12 |
| `/quem-e-nova-era` | 1 | 6 |
| `/como-funciona` | 9 | 32 |
| `/design-system` | 63 | 94 |

O tema claro reprova entre 1,5 e 3 vezes mais que o escuro em todas as rotas. As duas causas dominantes são as cores da paleta usadas como cor de texto sobre branco (item 7) e o token `--ow-text-subtle` (item 4). No tema escuro, esses mesmos tokens passam contra `#111111`.

Grupos com mais ocorrências:

**Tema escuro**

| Combinação | Ratio | Ocorrências |
|---|---|---|
| `#5f6368` sobre `#1a1a1a` | 2.88 | 10 |
| branco sobre `#ea4335` | 3.92 | 13 |
| branco sobre `#f06314` | 3.23 | 8 |
| `#ea4335` em alerta de erro | 3.86 | 8 |
| branco sobre `#00c3ff` | 2.05 | 7 |
| `#f1f3f4` sobre `#fbbc04` | 1.53 | 5 |

**Tema claro**

| Combinação | Ratio | Ocorrências |
|---|---|---|
| `#f06314` sobre branco | 3.23 | 21 |
| `#9aa0a6` sobre branco | 2.64 | 14 |
| branco sobre `#ea4335` | 3.92 | 13 |
| `#34a853` sobre branco | 3.06 | 8 |
| `#0099cc` sobre branco | 3.27 | 4 |

---

## Capturas

Em `docs/superpowers/specs/screenshots-validacao-tema/`:

| Arquivo | Conteúdo |
|---|---|
| `01-home-1440-escuro.jpg` | Home no escuro — mostra o bloco branco do `logostg1.png` |
| `02-home-1440-claro.jpg` | Home no claro — painel invertido preto sobre página branca |
| `03-alertas-1440-escuro.jpg` | Alertas e toasts do design system no escuro |
| `04-alertas-1440-claro.jpg` | Alertas e toasts do design system no claro |
| `05-home-390-escuro.jpg` | Home em 390×844 no escuro |
| `06-home-390-claro.jpg` | Home em 390×844 no claro |
