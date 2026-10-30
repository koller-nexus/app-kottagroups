---

description: "Task list for 029-pwa-installable"
---

# Tasks: Kotta Groups instalável como app (PWA)

**Input**: Design documents from `/specs/029-pwa-installable/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pwa-surface.md, quickstart.md

**Tests**: pedidos. A issue exige `node --test` da lógica em `lib/`, e a constituição (V) pede teste
para comportamento novo. E2E cobre manifest, cabeçalhos e página offline.

**Organization**: por história. US1 (instalar) é o MVP e não depende das demais; US2 (offline) usa a
base da Fase 2; US3 (aviso) e US4 (registro do SW) fecham o conjunto.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem depender de tarefa pendente)
- **[Story]**: história do spec.md (US1 a US4)

---

## Phase 1: Setup

- [X] T001 Rodar `pnpm test` e `pnpm lint` na branch `feature/029-pwa-installable` e confirmar que passam antes de qualquer mudança
- [X] T002 Ler `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md` (ou o caminho equivalente) para confirmar o formato de `MetadataRoute.Manifest` desta versão do Next

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: CSP, proxy e cabeçalhos que o manifest, o SW e a página offline exigem.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

- [X] T003 Em `lib/csp.ts`, acrescentar `"worker-src 'self'"` e `"manifest-src 'self'"` à lista da política (antes de `object-src`)
- [X] T004 [P] Em `lib/csp.test.mjs`, acrescentar asserções de que a política contém `worker-src 'self'` e `manifest-src 'self'`
- [X] T005 [P] Em `specs/024-csp-nonce/contracts/csp-header.md`, documentar `worker-src 'self'` e `manifest-src 'self'` e o motivo (`strict-dynamic` ignora `'self'` em `script-src`)
- [X] T006 Em `proxy.ts`, trocar o `matcher` por `"/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|offline\\.|.*\\.png$|.*\\.svg$).*)"` e atualizar o comentário explicando que `sw.js`, o manifest e `offline.*` ficam fora do proxy (sem nonce; `offline.js` externo seria bloqueado por `strict-dynamic`)
- [X] T007 Em `next.config.ts`, acrescentar em `headers()` uma entrada `{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] }` depois da entrada de `SECURITY_HEADERS`
- [X] T008 [P] Gerar com Pillow, a partir de `public/kotta-app-icon-green-nobg.png` (485×448, alfa), os PNG `public/icons/icon-192.png`, `icon-512.png` (marca em ~80% sobre transparente), `maskable-192.png`, `maskable-512.png` (marca em ~60% central sobre `#F1F4EE` (o logotipo é verde), preenchendo todo o quadrado) e `apple-touch-180.png` (marca sobre `#F1F4EE`, opaco); versionar só os PNG, sem script no repositório

**Checkpoint**: `pnpm test` e `pnpm lint` passam.

---

## Phase 3: User Story 1 - Instalar na tela inicial (Priority: P1) 🎯 MVP

**Goal**: o site é instalável com nome, ícone e cores da marca, abre em janela própria na página inicial.

**Independent Test**: `pnpm build && pnpm start`, DevTools → Application → Manifest sem erros; instalar e abrir (quickstart, Manual passos 1 e 6).

- [X] T009 [US1] Criar `app/manifest.ts` exportando `manifest(): MetadataRoute.Manifest` com `name` e `short_name` "Kotta Groups", `description`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `lang: "pt-BR"`, `background_color: colors.background`, `theme_color: colors.primary` (import de `@/lib/theme`) e `icons` 192 e 512 `purpose: "any"` e 192 e 512 `purpose: "maskable"` apontando para `/icons/*.png` (FR-001, FR-002)
- [X] T010 [US1] Em `app/layout.tsx`, exportar `viewport: Viewport` com `themeColor: colors.primary`; em `metadata`, trocar o ícone `apple` para `/icons/apple-touch-180.png` e acrescentar `appleWebApp: { capable: true, title: "Kotta Groups", statusBarStyle: "default" }`
- [X] T011 [US1] Criar `e2e/pwa.spec.ts` com o teste "manifest é válido": `GET /manifest.webmanifest` retorna 200 JSON com `display === "standalone"`, `start_url === "/"` e os 4 ícones (cada `src` responde 200 `image/png`); sem sessão, usar `test.use({ storageState: { cookies: [], origins: [] } })` como em `e2e/csp.spec.ts`

**Checkpoint**: US1 entregue sozinha: o app já é instalável.

---

## Phase 4: User Story 2 - Página "Sem conexão" (Priority: P2)

**Goal**: sem internet, navegação mostra a página do Kotta Groups; nada de conta fica em cache.

**Independent Test**: quickstart, Manual passos 2, 4 e 5.

- [X] T012 [P] [US2] Criar `public/offline.css` com variáveis CSS no topo copiadas de `DESIGN.md` (`--bg #F1F4EE`, `--primary #2F6B4F`, `--primary-deep #234F3B`, `--ink #18211C`, `--muted #56665C`, `--line #DCE3DC`) e comentário "espelha DESIGN.md; arquivo estático fora do Tailwind"; layout centralizado, botão ≥ 44px com `:focus-visible` de 2px na cor primária, legível em 375px, sem animação
- [X] T013 [P] [US2] Criar `public/offline.js` (sem inline): no clique de `#retry`, `fetch(location.href, { cache: "no-store" })`; se resolver (qualquer status), `location.reload()`; se lançar, escrever "Ainda sem conexão. Confira a internet e tente de novo." em `#status` (`role="status"`, `aria-live="polite"`); desabilitar o botão durante a tentativa
- [X] T014 [US2] Criar `public/offline.html` (`lang="pt-BR"`, `<meta name="viewport">`, `<title>Sem conexão — Kotta Groups</title>`, `<link rel="stylesheet" href="/offline.css">`, `<script src="/offline.js" defer>`), com `<main>`, logo `/icons/icon-192.png` com `alt=""`, `<h1>` "Sem conexão", uma frase de explicação, `<button id="retry">Tentar de novo</button>` e `<p id="status" role="status" aria-live="polite">` vazio
- [X] T015 [US2] Criar `public/sw.js`: constantes `CACHE = "kotta-offline-v1"` e `OFFLINE_FILES = ["/offline.html", "/offline.css", "/offline.js", "/icons/icon-192.png"]`; `install` → `caches.open(CACHE)`, `addAll(OFFLINE_FILES)`, `skipWaiting()`; `activate` → apagar chaves que começam com `kotta-offline-` e diferem de `CACHE`, `clients.claim()`; `fetch` → só se `request.mode === "navigate"`, `respondWith(fetch(request).catch(() => caches.match("/offline.html")))`; nenhum outro handler (FR-004 a FR-007, FR-013)
- [X] T016 [US2] Criar `lib/service-worker.test.mjs`: ler `public/sw.js`, executá-lo com `node:vm` num `self` falso (captura `addEventListener`, `caches` e `fetch` simulados, `skipWaiting`, `clients`) e testar: (a) `install` guarda exatamente os 4 arquivos; (b) `activate` apaga `kotta-offline-v0` e mantém o atual; (c) navegação com `fetch` ok devolve a resposta da rede e não chama `cache.put`; (d) navegação com `fetch` rejeitando devolve `/offline.html` do cache; (e) resposta 500 é repassada, não vira offline; (f) requisição não-navegação (ex.: `/api/v1/x`, `mode: "cors"`) não chama `respondWith`
- [X] T017 [US2] Em `e2e/pwa.spec.ts`, acrescentar: "sw.js sem cache" (200, `cache-control` contém `no-cache`, sem `nonce` na CSP) e "offline.html abre sem proxy" (200, tem `<h1>` "Sem conexão", `/offline.js` e `/offline.css` respondem 200 e a resposta de `/offline.html` não traz `script-src ... nonce-`)

**Checkpoint**: US2 testável pelas verificações automáticas; o SW ainda não é registrado (US4).

---

## Phase 5: User Story 3 - Aviso de instalação (Priority: P3)

**Goal**: convite discreto (botão no Android/desktop, instrução no iOS), dispensável e lembrado.

**Independent Test**: quickstart, Manual passo 3 e seção iPhone/iPad.

- [X] T018 [US3] Criar `lib/install-prompt.ts` com constantes `DISMISSED_KEY = "kotta:install-dismissed:v1"` e `PROMPT_PATHS = ["/", "/grupos"]`, e funções puras: `installPromptVariant({ standalone, ios, canPrompt, dismissed, pathname }): "button" | "ios" | null` na ordem de `data-model.md`; `isIosDevice(userAgent: string, maxTouchPoints: number): boolean` (iPhone|iPad|iPod, ou "Macintosh" com `maxTouchPoints > 1`); `isDismissed(storage: Pick<Storage, "getItem">): boolean` e `saveDismissed(storage: Pick<Storage, "setItem">, now: number): void`, ambos com `try/catch` (erro → `false` / ignora)
- [X] T019 [US3] Criar `lib/install-prompt.test.mjs` cobrindo: standalone → `null`; dispensado → `null`; rota `/entrar`, `/grupos/abc/notas` → `null`; `/` e `/grupos` com `canPrompt` → `"button"`; iOS sem `canPrompt` → `"ios"`; nem um nem outro → `null`; `isIosDevice` para iPhone, iPad com UA de Mac e `maxTouchPoints: 5`, Mac real (`0`) e Android; `isDismissed`/`saveDismissed` com storage falso e com storage que lança
- [X] T020 [US3] Criar `components/app/install-prompt.tsx` (`"use client"`): estado inicial `null` (sem divergência de hidratação); em `useEffect`, ler `matchMedia("(display-mode: standalone)")`/`navigator.standalone`, `isIosDevice`, `isDismissed(localStorage)`; ouvir `beforeinstallprompt` (`preventDefault`, guardar evento) e `appinstalled` (esconder); `usePathname()`; renderizar `<section aria-label="Instalar o Kotta Groups">` fixo no rodapé com `pb-[env(safe-area-inset-bottom)]`, textos de `contracts/pwa-surface.md`, botões "Instalar" (`event.prompt()`, esconder ao terminar) e "Agora não" (`saveDismissed` + esconder), alvos ≥ 44px, `focus-visible`, classes `kotta-*`, sem animação de entrada
- [X] T021 [US3] Montar `<InstallPrompt />` em `app/layout.tsx` ao lado de `<VercelInsights />`
- [X] T022 [US3] Em `e2e/pwa.spec.ts`, acrescentar: com `localStorage["kotta:install-dismissed:v1"]` definido, `/` não mostra a região "Instalar o Kotta Groups"; e a região nunca aparece em `/entrar` (injetar `beforeinstallprompt` com `page.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")))` para provar que a rota bloqueia mesmo com o evento)

**Checkpoint**: US3 funcional; banner só em `/` e `/grupos`.

---

## Phase 6: User Story 4 - Base para notificações futuras (Priority: P3)

**Goal**: SW registrado em produção sem pedir permissão.

**Independent Test**: após `pnpm build && pnpm start`, DevTools → Application → Service Workers mostra `sw.js` ativo; nenhum diálogo de permissão.

- [X] T023 [US4] Criar `components/app/service-worker-register.tsx` (`"use client"`, renderiza `null`): em `useEffect`, se `process.env.NODE_ENV === "production"` e `"serviceWorker" in navigator`, registrar `/sw.js` com `{ scope: "/", updateViaCache: "none" }` no evento `load` (ou já, se `document.readyState === "complete"`); `catch` silencioso com comentário de que falha de registro não pode afetar o site
- [X] T024 [US4] Montar `<ServiceWorkerRegister />` em `app/layout.tsx` ao lado de `<InstallPrompt />`

**Checkpoint**: as quatro histórias entregues.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T025 [P] Rodar `pnpm lint` e `pnpm test` e corrigir o que falhar
- [X] T026 [P] Rodar `pnpm build` e conferir que `/manifest.webmanifest` aparece como rota e que o build não avisa sobre `sw.js`/`public`
- [X] T027 Rodar `e2e/pwa.spec.ts` contra `next start` (5/5 passam, sem violação de CSP). A suíte completa (`pnpm test:e2e`) precisa da API simulada e não foi rodada
- [X] T028 Executar o quickstart manual em Chrome (passos 1 a 6) com `pnpm build && pnpm start` e em 375px; registrar o resultado na descrição da PR (iPhone/iPad ficam para teste do dono, se não houver aparelho). Feito com Playwright/Chromium em 375px e desktop; instalação pelo diálogo do navegador e iOS reais não testados

---

## Dependencies & Execution Order

- Fase 1 → Fase 2 (bloqueia tudo) → US1 → US2 → US3 → US4 → Polish.
- US1 não depende de US2 a US4. US2 depende de T003, T006, T007, T008. US3 não depende de US2. US4 depende de T015 (o arquivo `public/sw.js` precisa existir). T021 e T024 editam o mesmo `app/layout.tsx`, e T010 também: executar em sequência.
- Dentro de US2: T012 e T013 antes de T014; T015 antes de T016 e T017.

## Parallel Opportunities

- Fase 2: T004, T005 e T008 em paralelo após T003 (T008 é independente de todos).
- US2: T012 e T013 em paralelo.
- US3: T018 e T019 em sequência; T020 só depois de T018. US3 e US2 podem andar em paralelo por pessoas diferentes (exceto edições em `app/layout.tsx`).
- Polish: T025 e T026 em paralelo.

## Implementation Strategy

- **MVP**: Fases 1, 2 e 3 (US1): site instalável.
- **Incremento 2**: US2 (offline) e US4 (registro do SW), entregues juntos para o SW passar a valer.
- **Incremento 3**: US3 (aviso).
- Commits em inglês, Conventional Commits, um por fase.
