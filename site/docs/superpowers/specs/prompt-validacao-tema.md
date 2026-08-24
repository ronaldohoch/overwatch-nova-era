# Prompt: validação visual do tema claro/escuro

Cole o bloco abaixo para um agente com o Chrome MCP habilitado
(`claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest`).

---

Você vai validar visualmente a implementação de tema claro/escuro de um site
Angular 21 (Tailwind v4, SSR). Use o Chrome MCP para navegar, trocar tema,
tirar screenshots e **olhar** o resultado. Não confie apenas no DOM: o objetivo
é achar o que está feio, ilegível ou quebrado aos olhos.

## Subir o site

O servidor SSR deve estar em http://localhost:4000. Se não responder:

```
cd c:\Users\ronal\OneDrive\Documentos\Projetos\overwatch-nova-era\site
npm run build && node dist/site/server/server.mjs
```

**Atencao:** `npm run build` reescreve `dist/` e derruba um servidor que ja
esteja rodando. Se o site estiver no ar, NAO rode build durante a validacao —
ou religue o servidor depois. O build atual ja esta pronto e servido.

## Como o tema funciona

- Atributo `data-theme` no `<html>`, valores `"dark"` | `"light"`.
- **O padrão é escuro.** O claro é opt-in.
- Persistido em `localStorage['ow-theme']`.
- Trocar por script: `document.documentElement.setAttribute('data-theme','light')`
- Trocar pela interface: botão sol/lua no **rodapé** de qualquer página.
- Tokens em `src/styles.css`, em duas camadas: bruta (`--ow-orange`,
  `--ow-gray-*`) que não muda entre temas, e semântica (`--ow-bg`,
  `--ow-surface*`, `--ow-text*`, `--ow-border*`, `--ow-alert-*`,
  `--ow-overlay`, `--ow-panel-invert`, `--ow-code-*`) que muda.

## Rotas públicas (testar TODAS nos DOIS temas)

```
/                     home STG (hero preto, timeline, cards, parceria, CTA)
/quem-e-nova-era      conteúdo antigo (próximas partidas, hero Winston, seções)
/como-funciona
/duvidas-frequentes   (FAQ com acordeão — abra alguns itens)
/regras
/torneio
/torneios/jCrpbomkCfDF4BLPJOsu
/login                (formulário + link de recuperar senha)
/reset-password
/design-system        ⭐ a mais importante: mostra TODOS os componentes
```

`/watchpoint/*` exige login. Se não tiver credenciais, reporte como não coberto —
não tente burlar autenticação.

## Pontos de risco específicos (verificar um a um)

1. **Painel invertido da home** — o hero "STG Esports" e o CTA final usam
   `--ow-panel-invert`. No tema CLARO devem ser blocos com gradiente preto sobre
   página branca. No tema ESCURO o fundo deve **sumir** e fundir com a página
   preta, sem deixar uma borda/emenda visível. Confirme que não sobrou nenhuma
   silhueta do clip-path.

2. **Imagens sobre fundo escuro** — `logostg1.png`, `logo-nova-era-low-res.webp`,
   `winston.webp`, `tracer-hero.webp`. Foram feitas para fundo claro. Procure
   halo branco, borda serrilhada ou logo que some no preto.

3. **Overlay de modal** — mudou de véu claro (`bg-slate-300/20`) para escuro
   (`--ow-overlay`). Abra um modal (a página `/design-system` tem exemplos) e
   confira nos dois temas: o conteúdo atrás deve escurecer, não clarear.

4. **Alertas** — 4 variantes (info/success/warning/error) em `/design-system`.
   No escuro o texto deve clarear; confirme que nenhum sumiu no fundo tingido.

5. **Toast e tooltip** — têm fundo fixo `--ow-gray-700` (#202124). No tema
   escuro a página é #111111. Verifique se ainda se distinguem do fundo ou se
   ficaram um borrão só.

6. **Formulários** — input, textarea, select, checkbox, radio, toggle em
   `/design-system` e em `/login`. Cheque placeholder, estado desabilitado,
   borda de foco e os estados de erro/sucesso nos dois temas.

7. **Bloco de código** (`/design-system`, botão "Código" nas seções) — usa
   Catppuccin Latte no claro e Mocha no escuro. Confirme que troca.

8. **Swatches de cor** (`/design-system`, seção Cores) — as amostras devem
   mostrar as cores reais da paleta, e o rótulo em texto (ex: `#f06314`) deve
   bater com a cor exibida ao lado.

9. **Links do header** — eram `text-slate-600` fixo, agora
   `--ow-text-muted`. Confirme legibilidade nos dois temas, incluindo o estado
   ativo (laranja) e o hover.

10. **Flash ao carregar** — recarregue com o tema ESCURO: não deve piscar
    branco em momento nenhum. Com o tema CLARO salvo, um flash escuro breve é
    esperado e aceitável (o CSS crítico nasce escuro de propósito).

11. **Persistência** — troque pelo botão do rodapé, recarregue (F5), e confirme
    que o tema escolhido continua. Depois navegue entre rotas e confirme que não
    volta ao padrão.

12. **Bracket** — `/torneio` e a página de chaveamento: linhas conectoras,
    cards de partida e o pódio.

## Verificação de contraste (além do olho)

Rode no console de cada página, nos dois temas, e reporte o que falhar:

```js
(() => {
  const lum = c => { const [r,g,b] = c.match(/\d+/g).map(Number).map(v => {
    v/=255; return v<=.03928 ? v/12.92 : ((v+.055)/1.055)**2.4; });
    return .2126*r + .7152*g + .0722*b; };
  const bgOf = el => { let n = el;
    while (n && n !== document.documentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && !/rgba?\(0, 0, 0, 0\)|transparent/.test(c)) return c;
      n = n.parentElement; }
    return getComputedStyle(document.body).backgroundColor; };
  const out = [];
  document.querySelectorAll('*').forEach(el => {
    if (!el.childNodes.length) return;
    const txt = [...el.childNodes].filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim()).join('');
    if (!txt) return;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return;
    const L1 = lum(s.color), L2 = lum(bgOf(el));
    const ratio = (Math.max(L1,L2) + .05) / (Math.min(L1,L2) + .05);
    const size = parseFloat(s.fontSize);
    const large = size >= 24 || (size >= 18.66 && +s.fontWeight >= 700);
    if (ratio < (large ? 3 : 4.5))
      out.push({ ratio: ratio.toFixed(2), size: s.fontSize, color: s.color,
                 bg: bgOf(el), txt: txt.slice(0,60), sel: el.tagName.toLowerCase()
                 + (el.className ? '.' + String(el.className).split(' ')[0] : '') });
  });
  console.table(out.slice(0, 40));
  return out.length + ' elementos abaixo do contraste WCAG AA';
})()
```

## O que entregar

Para cada rota, nos dois temas:

- Screenshot (viewport 1440x900 e 390x844 para mobile).
- Lista de problemas visuais concretos: **onde** (rota + elemento), **o quê**
  (texto ilegível / cor errada / elemento sumido / emenda visível), **em qual
  tema**, e a severidade.
- A saída do script de contraste, resumida — só o que falhou.
- Se não achar problema em algum item da lista de riscos, diga explicitamente
  que verificou e estava correto. Não invente problema para preencher relatório,
  e não presuma que está certo sem ter olhado.

Não corrija nada. Só relate.
