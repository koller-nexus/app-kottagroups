# Research: PWA instalável

Sem `NEEDS CLARIFICATION` no contexto técnico. Decisões:

## R1. Service worker: arquivo à mão em vez de Serwist

- **Decision**: `public/sw.js` escrito à mão, ~40 linhas, sem build.
- **Rationale**: o único trabalho é (a) pré-guardar 4 arquivos estáticos e (b) responder a navegações
  que falham na rede com a página offline. Constituição I: dependência nova não se justifica para
  menos de ~20 linhas de lógica real; aqui são poucas mais, e sem plugin no pipeline do Turbopack
  (o guia do Next cita Serwist com exemplos separados para Turbopack/webpack).
- **Alternatives**: Serwist (precache gerado, mas dependência + integração de build; recursos que
  não usaremos); `experimental.useOffline` do Next (cuida de UI e retentativa, não de página offline
  com o app fechado).

## R2. O que o SW guarda e o que não guarda

- **Decision**: guarda só `/offline.html`, `/offline.css`, `/offline.js` e o ícone usado nela, no
  cache `kotta-offline-v1`. Navegações: `fetch` direto; só em falha de rede (`TypeError`) devolve
  `/offline.html`. Os pedidos desses 4 arquivos saem do cache (sem isso a página offline perderia CSS e botão). Qualquer outra requisição (API, RSC, `/_next/*`, imagens) não passa pelo SW.
- **Rationale**: FR-004/005/006/007. Nada de conta é guardado, então logout e troca de conta não
  deixam resíduo (FR-007 satisfeito por construção). Resposta 4xx/5xx não é "offline": é repassada.
- **Alternatives**: cache runtime de `/_next/static` (descartado: offline não renderiza o app, e o
  cache HTTP já cobre; YAGNI); network-first com cache de páginas (descartado: risco de mostrar
  dados de conta antigos, proibido pelo FR-006).

## R3. Página offline estática, fora do proxy

- **Decision**: `public/offline.{html,css,js}`, sem script inline; `proxy.ts` passa a excluir
  `sw.js`, `manifest.webmanifest` e `offline.*` do matcher.
- **Rationale**: pelo proxy, a resposta ganha CSP com nonce e `strict-dynamic`, que ignora `'self'`
  em `script-src`: o `offline.js` externo seria bloqueado. Fora do proxy valem só os cabeçalhos do
  `next.config.ts` (`frame-ancestors 'none'` etc.). Os arquivos não têm dado sensível.
- **Alternatives**: rota `/offline` em React (ver Complexity Tracking); script inline com nonce
  (o nonce muda a cada requisição, não dá para pré-guardar).

## R4. CSP: `worker-src` e `manifest-src`

- **Decision**: acrescentar `worker-src 'self'` e `manifest-src 'self'` em `lib/csp.ts`.
- **Rationale**: `worker-src` cai em `child-src`/`script-src`, e com `strict-dynamic` o `'self'` é
  ignorado; sem diretiva explícita o registro do SW pode ser bloqueado. `default-src 'self'` já
  cobre o manifest, mas explícito deixa a intenção clara e travada em teste.
- **Alternatives**: confiar no fallback (comportamento varia por navegador).

## R5. Retentativa na página offline

- **Decision**: `offline.js` faz `fetch(location.href, { cache: "no-store" })`; se `ok`/qualquer
  resposta HTTP chega, `location.reload()`; se lança, escreve a mensagem em região `aria-live="polite"`.
- **Rationale**: o SW só intercepta navegações, então esse `fetch` vai direto à rede. Qualquer
  resposta HTTP prova que a conexão voltou (um 401/redirect é tratado pelo app depois do reload).

## R6. Aviso de instalação

- **Decision**: componente cliente com estado derivado de `lib/install-prompt.ts`:
  `installPromptVariant({ standalone, ios, canPrompt, dismissed, pathname })` → `"button" | "ios" | null`.
  Mostra só em `/` e `/grupos` (lista de permissão → FR-011 sem enumerar fluxos sensíveis).
  `beforeinstallprompt` guardado em estado (com `preventDefault()`); `appinstalled` esconde.
  iOS: UA `iPhone|iPad|iPod` ou Mac com `maxTouchPoints > 1` (iPadOS); instrução manual.
  Standalone: `matchMedia("(display-mode: standalone)")` ou `navigator.standalone`.
- **Rationale**: o guia do Next desaconselha `beforeinstallprompt` por não ser multiplataforma, mas
  é o que a issue pede e degrada bem (sem evento = sem botão; iOS tem a instrução).
- **Alternatives**: confiar só no prompt nativo do navegador (não atende a issue).

## R7. Dispensa

- **Decision**: `localStorage["kotta:install-dismissed:v1"] = String(timestamp)`, leitura e escrita
  em `try/catch` (modo privado/cota). Presença da chave = dispensado, sem prazo (Assumptions).
- **Rationale**: guia `client-localstorage-schema` (chave versionada, mínimo de dados).

## R8. Ícones e manifest

- **Decision**: `app/manifest.ts` com `name`/`short_name` "Kotta Groups", `start_url: "/"`,
  `scope: "/"`, `display: "standalone"`, `lang: "pt-BR"`, `background_color: colors.background`
  (#F1F4EE), `theme_color: colors.primary` (#2F6B4F), ambos de `lib/theme.ts`. Ícones PNG 192/512
  `purpose: "any"` e 192/512 `purpose: "maskable"` (marca em ~60% central sobre #F1F4EE: o logotipo é verde e sumiria em fundo verde), mais
  `apple-touch-icon` 180 opaco. Gerados uma vez a partir de `public/kotta-app-icon-green-nobg.png`
  (485×448, alfa) com Pillow; os PNG ficam versionados, sem passo de build.
- **Rationale**: `kotta-icon.png` (1024, sem alfa) serve de conferência, mas o `nobg` é a marca
  isolada; a margem da maskable fica na área segura (80% central).
- **Alternatives**: `app/icon.tsx`/`ImageResponse` dinâmico (complexidade sem ganho).

## R9. Atualização de versão

- **Decision**: `skipWaiting()` no `install`, `clients.claim()` e limpeza de caches antigos no
  `activate`; registro com `updateViaCache: "none"`; `/sw.js` com `Cache-Control: no-cache`.
  O nome do cache (`kotta-offline-vN`) é incrementado quando os arquivos offline mudam.
- **Rationale**: FR-013. Como o SW não guarda nada de conta, trocar de versão sem esperar é seguro.

## R10. Push (FR-014)

- **Decision**: só o registro do SW. Nenhum handler de `push`/`notificationclick`, nenhum pedido de
  permissão; B13 adiciona.
