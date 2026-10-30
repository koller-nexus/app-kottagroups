# Contract: superfície PWA

## `GET /manifest.webmanifest` (gerado por `app/manifest.ts`)

JSON com: `name` e `short_name` = "Kotta Groups"; `start_url` e `scope` = "/"; `display` =
"standalone"; `lang` = "pt-BR"; `background_color` = `colors.background`; `theme_color` =
`colors.primary`; `icons` = 192 e 512 com `purpose: "any"` e 192 e 512 com `purpose: "maskable"`.
Fora do proxy (sem nonce).

## `GET /sw.js`

- `Cache-Control: no-cache` (de `next.config.ts`); fora do proxy.
- Eventos: `install` (pré-guarda os 4 arquivos, `skipWaiting`), `activate` (apaga caches `kotta-offline-*`
  diferentes do atual, `clients.claim`), `fetch` (navegações e os 4 arquivos offline).
- Regras de `fetch`: pedidos dos 4 arquivos offline (`/offline.css`, `/offline.js`, ícone) saem do cache, com `fetch` só se faltarem; navegações: `fetch(request)`; em exceção → `caches.match("/offline.html")`; resposta HTTP de
  qualquer status é repassada. Qualquer outra requisição não é interceptada.

## `GET /offline.html` (+ `/offline.css`, `/offline.js`)

- Estática, fora do proxy, sem script inline, `lang="pt-BR"`, `<main>` com `<h1>` "Sem conexão",
  texto de uma frase, botão "Tentar de novo", `<p role="status" aria-live="polite">` vazio.
- Botão: ver R5 em [research.md](../research.md). Mensagem quando ainda offline:
  "Ainda sem conexão. Confira a internet e tente de novo."

## Cabeçalho CSP (mudança no contrato de `specs/024-csp-nonce/contracts/csp-header.md`)

Acrescenta `worker-src 'self'` e `manifest-src 'self'` à política das páginas.

## Aviso de instalação (UI)

- `<section aria-label="Instalar o Kotta Groups">` fixo no rodapé, sem cobrir a navegação inferior
  (respeita `env(safe-area-inset-bottom)`).
- Variante `button`: texto "Instale o Kotta Groups na sua tela inicial", botões "Instalar" e "Agora não".
- Variante `ios`: "Para instalar, toque em Compartilhar e depois em Adicionar à Tela de Início", botão "Agora não".
- Alvos ≥ 44px, foco visível, tokens `kotta-*`, sem animação de entrada além de `prefers-reduced-motion`-safe.
