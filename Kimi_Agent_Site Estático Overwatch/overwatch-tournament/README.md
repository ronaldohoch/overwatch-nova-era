# 🎮 Overwatch Championship Tournament

Site estático para torneio competitivo de Overwatch 2, desenvolvido com HTML5, TailwindCSS e JavaScript vanilla.

---

## 📋 Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Como Usar](#como-usar)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Assets e Media Kit](#assets-e-media-kit)
- [Personalização](#personalização)
- [Tailwind CSS - Play CDN vs Build](#tailwind-css---play-cdn-vs-build)
- [Avisos Legais](#avisos-legais)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

Este é um site demonstrativo para um torneio de Overwatch, criado como projeto educacional. O design é inspirado no visual oficial do jogo Overwatch, utilizando a paleta de cores característica (laranja, preto, azul) e elementos visuais que remetem à identidade do jogo.

### Funcionalidades

- ✅ Página inicial com countdown e destaques
- ✅ Bracket completo do torneio
- ✅ Página de times com jogadores
- ✅ Agenda/calendário de partidas
- ✅ Página de regras e regulamento
- ✅ Design responsivo (mobile-friendly)
- ✅ Menu de navegação fixo
- ✅ Animações e efeitos visuais

---

## 🛠 Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| HTML5 | - | Estrutura das páginas |
| TailwindCSS | 3.x (CDN) | Estilização utilitária |
| CSS3 | - | Estilos customizados (tema Overwatch) |
| JavaScript | ES6+ | Interatividade (menu, countdown, filtros) |

**Nota importante:** Este projeto usa o **Tailwind CSS via Play CDN**, ideal para protótipos e desenvolvimento rápido sem necessidade de build.

---

## 🚀 Como Usar

### Opção 1: Abrir Localmente (Mais Simples)

1. Baixe ou clone este repositório
2. Navegue até a pasta do projeto
3. Abra o arquivo `index.html` em qualquer navegador moderno

```bash
# No Windows
cd overwatch-tournament
start index.html

# No macOS
cd overwatch-tournament
open index.html

# No Linux
cd overwatch-tournament
xdg-open index.html
```

### Opção 2: Servidor Local (Recomendado para desenvolvimento)

Se você tem Python, Node.js ou PHP instalado:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (com npx)
npx serve .

# PHP
php -S localhost:8000
```

Depois acesse `http://localhost:8000`

---

## 📁 Estrutura de Arquivos

```
overwatch-tournament/
│
├── index.html                 # Página inicial
├── README.md                  # Este arquivo
│
├── css/
│   └── overwatch-theme.css    # Estilos customizados do tema
│
├── js/                        # (opcional) Scripts adicionais
│
├── pages/
│   ├── torneio.html          # Bracket do torneio
│   ├── times.html            # Lista de times
│   ├── agenda.html           # Agenda de partidas
│   └── regras.html           # Regras e regulamento
│
└── assets/
    └── overwatch/            # Pasta para assets do jogo
        ├── heroes/           # Imagens de heróis
        ├── logos/            # Logos oficiais
        └── backgrounds/      # Wallpapers
```

---

## 🎨 Assets e Media Kit

### Media Kit Oficial da Blizzard

Para obter assets oficiais de Overwatch (renders de personagens, logos, wallpapers):

1. Acesse: **[Blizzard Press Center - Overwatch](https://blizzard.gamespress.com/overwatch)**
2. Faça login ou crie uma conta (gratuito para imprensa/criadores de conteúdo)
3. Baixe os assets desejados
4. Coloque na pasta `assets/overwatch/` seguindo a estrutura sugerida

### Assets Utilizados no Projeto

Este projeto demonstrativo usa:
- Emojis como placeholders para ícones de times (⚡ 🐉 ❄️ 🔥 etc.)
- SVG inline para o logo do torneio
- Gradientes CSS para efeitos visuais

**Para produção:** Substitua os emojis por imagens oficiais do press kit.

---

## 🎨 Personalização

### Cores do Tema

As cores principais estão definidas no arquivo `css/overwatch-theme.css`:

```css
:root {
  --ow-orange: #f99e1a;        /* Laranja Overwatch */
  --ow-orange-dark: #d4820a;   /* Laranja escuro */
  --ow-blue: #00c3ff;          /* Azul Overwatch */
  --ow-dark: #1a1a1a;          /* Fundo escuro */
  --ow-dark-secondary: #2a2a2a;
  --ow-dark-tertiary: #3a3a3a;
}
```

### Modificando Dados do Torneio

Para atualizar informações do torneio, edite diretamente nos arquivos HTML:

- **Times:** Edite `pages/times.html`
- **Partidas:** Edite `pages/torneio.html` e `pages/agenda.html`
- **Prêmios:** Edite `index.html` e `pages/regras.html`
- **Countdown:** Ajuste a data no JavaScript de `index.html`

---

## ⚙️ Tailwind CSS - Play CDN vs Build

### Play CDN (Atual)

Este projeto usa o **Tailwind Play CDN** via script tag:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

**Vantagens:**
- ✅ Zero configuração
- ✅ Funciona direto no navegador
- ✅ Ideal para protótipos e demos
- ✅ Perfeito para hospedagem estática simples

**Limitações:**
- ❌ Não recomendado para produção com alto tráfego
- ❌ Carrega todas as classes (maior tamanho)
- ❌ Sem purging de CSS não utilizado

### Build com Tailwind CLI (Opcional para Produção)

Para um build otimizado:

1. **Instale as dependências:**

```bash
npm init -y
npm install -D tailwindcss
npx tailwindcss init
```

2. **Configure o `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./pages/*.html"],
  theme: {
    extend: {
      colors: {
        'ow-orange': '#f99e1a',
        'ow-blue': '#00c3ff',
        'ow-dark': '#1a1a1a',
      }
    },
  },
  plugins: [],
}
```

3. **Crie o arquivo CSS de entrada (`src/input.css`):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

4. **Compile:**

```bash
npx tailwindcss -i ./src/input.css -o ./css/output.css --watch
```

5. **Substitua no HTML:**

```html
<!-- Remova -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Adicione -->
<link rel="stylesheet" href="css/output.css">
```

---

## ⚠️ Avisos Legais

### IMPORTANTE - LEIA ATENTAMENTE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         AVISO LEGAL IMPORTANTE                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Este é um projeto NÃO OFICIAL criado por fãs para fins EDUCACIONAIS e       ║
║  DEMONSTRATIVOS.                                                             ║
║                                                                              ║
║  Overwatch®, Overwatch 2® e Blizzard Entertainment® são marcas registradas   ║
║  da Blizzard Entertainment, Inc.                                             ║
║                                                                              ║
║  Este projeto NÃO é:                                                         ║
║  • Afiliado à Blizzard Entertainment                                         ║
║  • Endossado pela Blizzard Entertainment                                     ║
║  • Patrocinado pela Blizzard Entertainment                                   ║
║  • Aprovado pela Blizzard Entertainment                                      ║
║                                                                              ║
║  Todos os direitos sobre personagens, logos, nomes e elementos visuais de    ║
║  Overwatch pertencem exclusivamente à Blizzard Entertainment, Inc.           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Uso de Assets Oficiais

- Os assets do press kit da Blizzard são fornecidos para uso jornalístico e de cobertura
- Não use logos ou marcas da Blizzard de forma que sugira afiliação oficial
- Não monetize diretamente conteúdo usando marcas da Blizzard sem permissão
- Sempre inclua avisos de não-afiliação quando apropriado

### Recomendações

1. **Para uso pessoal/educacional:** Este projeto pode ser usado livremente
2. **Para publicação online:** Inclua avisos claros de não-afiliação
3. **Para torneios reais:** Considere criar sua própria identidade visual original

---

## 📄 Licença

### Código do Projeto

O código fonte deste projeto (HTML, CSS, JS) está disponível sob licença **MIT**:

```
MIT License

Copyright (c) 2025 Overwatch Championship Tournament (Demo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

### Assets de Terceiros

- **Tailwind CSS:** Licenciado sob MIT (© Tailwind Labs, Inc.)
- **Overwatch Assets:** Propriedade da Blizzard Entertainment, Inc.

---

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir melhorias
- Enviar pull requests
- Compartilhar o projeto

---

## 📞 Contato

Para dúvidas ou sugestões sobre este projeto:

- Discord: [Link do servidor]
- Email: contato@overwatch-tournament.demo

---

## 🙏 Agradecimentos

- Blizzard Entertainment por criar Overwatch
- Comunidade de Overwatch pelo apoio contínuo
- Tailwind Labs pelo excelente framework CSS

---

<div align="center">

**[⬆ Voltar ao topo](#-overwatch-championship-tournament)**

*Projeto criado com ❤️ pela comunidade*

</div>
