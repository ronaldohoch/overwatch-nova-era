# Decisões pendentes — contraste da paleta da marca

Dois itens da validação visual não foram aplicados porque mudam a
identidade visual do site. Precisam da sua decisão.

Ambos são **anteriores ao dark mode** — não são regressões do refactor.
A paleta da Copa Nova Era sempre teve esses valores; o que a validação fez
foi medir. E ambos afetam **só o tema claro**, que não é o padrão do site.

Tudo o mais do relatório já foi aplicado e commitado.

---

## Decisão 1 — cor da marca usada como cor de texto

Sobre fundo branco, as cores da paleta reprovam o mínimo de 4.5:1 do
WCAG AA para texto normal:

| Token | Valor | Sobre branco | Proposta | Sobre branco |
|---|---|---|---|---|
| `--ow-orange` | `#f06314` | 3.23 | `#b4470c` | **5.46** |
| `--ow-blue` | `#00c3ff` | 2.05 | `#00708f` | **5.65** |
| `--ow-green` | `#34a853` | 3.06 | `#237a3c` | **5.36** |
| `--ow-red` | `#ea4335` | 3.92 | `#c0271b` | **5.92** |

**Onde aparece:** 21 ocorrências em `/design-system`, 19 em
`/como-funciona`, 4 em `/quem-e-nova-era`. Inclui "Copa Nova Era · 2026",
os títulos "Links" e "Recursos" do rodapé, as eyebrows "Nossa origem",
"Trajetória", "O campeonato" e "Parceria" da home, e o prêmio "R$ 3.000"
do pódio em `/torneio`.

**Como eu faria:** criar tokens `--ow-orange-text`, `--ow-blue-text` etc.,
usados só quando a cor é *texto*. No tema claro recebem os valores
escurecidos; no escuro continuam a cor de marca original, que lá já passa
(laranja sobre `#111111` dá 5.84). O `#f06314` segue intacto em
preenchimentos: botões, badges, bordas, o sublinhado do link ativo.

Isso é importante porque escurecer o token global quebraria o tema
escuro — as mesmas cores propostas caem para ~3.3 sobre `#111111`.

**Opções:**

- **A** — aplicar como descrito: só texto, só no tema claro. O laranja
  dos textos fica visivelmente mais terroso no claro.
- **B** — não mexer. O tema claro segue fora de AA nesses pontos; como
  não é o padrão, o impacto real é menor.
- **C** — aplicar só no laranja, que é o de maior volume, e deixar as
  outras cores como estão.

---

## Decisão 2 — badges de cor sólida com texto branco

| Fundo | Com texto branco | Com texto `#202124` |
|---|---|---|
| `#00c3ff` azul | 2.05 | **7.86** |
| `#9aa0a6` cinza | 2.64 | **6.10** |
| `#34a853` verde | 3.06 | **5.27** |
| `#f06314` laranja | 3.23 | **4.98** |
| `#ea4335` vermelho | 3.92 | **4.10** |

Vale nos dois temas: o badge tem fundo próprio, então independe da página.

O badge amarelo já foi corrigido — usava texto escuro de propósito e o
refactor o inverteu por engano. A correção criou `--ow-on-accent-dark`,
que é exatamente o token que estas opções reaproveitariam.

**Opções:**

- **A** — texto escuro (`--ow-on-accent-dark`) em todos os badges.
  Todos passam AA, mas muda bastante o visual: hoje são coloridos com
  texto branco, virariam coloridos com texto quase preto.
- **B** — texto escuro só onde o ganho é maior e o branco é pior
  (azul e cinza), mantendo branco em laranja, verde e vermelho.
- **C** — escurecer o fundo dos badges e manter o texto branco.
  Preserva o padrão "texto branco sobre cor", mas afasta os badges da
  cor exata da marca.
- **D** — não mexer.

---

## Contexto para escolher

Nem tudo que reprova AA é problema prático. Um badge é curto, grande,
em caixa alta e com peso extrabold — o critério de "texto grande" (3:1)
é discutivelmente o aplicável, e aí laranja, verde e vermelho já passam.
O caso mais defensável de correção é o azul `#00c3ff` a 2.05, que é
baixo por qualquer critério.

Minha recomendação: **1-A** e **2-B**. Corrige o que é de fato ilegível
sem descaracterizar o visual, e mantém a marca intacta no tema padrão.
