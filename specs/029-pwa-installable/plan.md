# Implementation Plan: Kotta Groups instalável como app (PWA)

**Branch**: `feature/029-pwa-installable` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/029-pwa-installable/spec.md`

## Summary

Tornar o site instalável (manifest + ícones), com página "Sem conexão" servida por um service worker
mínimo e um aviso de instalação dispensável. **Sem dependência nova**: o service worker é um
`public/sw.js` escrito à mão (só pré-guarda a página offline e responde a navegações que falham na
rede); nada de conta, API ou HTML de página é guardado. A lógica decisória do aviso fica em
`lib/install-prompt.ts` (testada). Detalhes e alternativas em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (app), JavaScript puro para `public/sw.js` e `public/offline.js`

**Primary Dependencies**: Next.js 16.4.2 (App Router, `app/manifest.ts`), React 19.2. Nenhuma nova.

**Storage**: `localStorage` (chave `kotta:install-dismissed:v1`); Cache Storage (`kotta-offline-v1`, só 4 arquivos estáticos)

**Testing**: `node --test` em `lib/*.test.mjs` (`pnpm test`); Playwright em `e2e/pwa.spec.ts`

**Target Platform**: Navegadores modernos (Chrome/Edge/Android, Safari iOS 16.4+/macOS, Firefox desktop); degrada sem erro nos demais

**Project Type**: Aplicação web (Next.js), só front

**Performance Goals**: sem custo perceptível: registro do SW depois do `load`; banner montado só no cliente

**Constraints**: CSP com nonce e `strict-dynamic` (spec 024) deve continuar valendo; `/api` e páginas de conta nunca em cache; 375px e desktop

**Scale/Scope**: 1 manifest, 1 SW, 1 página estática offline, 2 componentes cliente, 1 módulo `lib/`

## Constitution Check

| Princípio | Avaliação |
|-----------|-----------|
| I. Simplicity First | OK. Sem Serwist (dependência + plugin de build para ~40 linhas). Sem cache de `/_next/static` em runtime (offline não renderiza nada além da página offline; o cache HTTP já cobre o resto). Sem handlers de push (B13). |
| II. Clean Code | OK. Constantes nomeadas (nome do cache, chave, caminhos). Arquivos curtos. |
| III. Organized Structure | OK. Regras em `lib/`, UI em `components/app/`, estáticos em `public/`. |
| IV. Best Practices | OK com 1 exceção justificada (ver Complexity Tracking). Server Components por padrão; `"use client"` só nos 2 componentes. Manifest usa tokens de `lib/theme.ts`. Foco visível, rótulos, `prefers-reduced-motion`. |
| V. Testable by Default | OK. `lib/install-prompt.test.mjs` e `lib/service-worker.test.mjs` (carrega o `sw.js` real num sandbox `vm`). |
| Stack | `pnpm`, TS, sem `any`. Commits em inglês (Conventional Commits). |
| VERSION | Não existe arquivo `VERSION` (pendência já registrada na constituição); sem ação. |

**Re-check pós-design**: sem violações novas.

## Project Structure

### Documentation (this feature)

```text
specs/029-pwa-installable/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pwa-surface.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── manifest.ts                      # novo: manifest (nome, cores de lib/theme.ts, ícones)
└── layout.tsx                       # editar: viewport.themeColor, appleWebApp, ícone Apple 180, monta os 2 componentes
components/app/
├── service-worker-register.tsx      # novo, "use client": registra /sw.js em produção, após load; renderiza null
└── install-prompt.tsx               # novo, "use client": aviso (botão Android / instrução iOS), dispensa
lib/
├── install-prompt.ts                # novo: variante, iOS, dispensa (puro)
├── install-prompt.test.mjs          # novo
├── service-worker.test.mjs          # novo: sandbox vm sobre public/sw.js
└── csp.ts (+ csp.test.mjs)          # editar: worker-src 'self'; manifest-src 'self'
public/
├── sw.js                            # novo: pré-cache offline + fallback de navegação
├── offline.html / offline.css / offline.js   # novos: página "Sem conexão" autocontida
└── icons/                           # novos: icon-192, icon-512, maskable-192, maskable-512, apple-touch-180 (PNG)
proxy.ts                             # editar: matcher exclui sw.js, manifest.webmanifest, offline.*
next.config.ts                       # editar: /sw.js com Cache-Control no-cache
e2e/pwa.spec.ts                      # novo
specs/024-csp-nonce/contracts/csp-header.md   # editar: documentar worker-src/manifest-src
```

**Structure Decision**: projeto único Next.js; a página offline é estática em `public/` (não rota
React) porque precisa funcionar do cache do SW sem nonce nem chunks JS do Next.

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|---------------------|-------------------------------------------|
| `public/offline.css` com cores em hex (IV: tokens, não hex cru) | Arquivo estático servido do cache do SW; não passa pelo Tailwind e não tem URL estável para `globals.css` (hash). | Rota React `/offline`: dependeria de chunks JS/CSS com hash e do nonce da CSP, que o SW não consegue pré-guardar de forma determinística. Mitigação: valores copiados de `DESIGN.md` como variáveis CSS no topo do arquivo, com comentário apontando a fonte. |
