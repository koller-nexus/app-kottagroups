# Contrato: telas de erro

## `components/app/error-state.tsx` (Server Component, sem estado)

```tsx
<ErrorState
  kind="not-found" | "session-expired" | "offline" | "unavailable" | "unexpected"
  title?: string            // padrão: ERROR_COPY[kind].title
  text?: string             // padrão: ERROR_COPY[kind].text
  code?: string             // renderiza "Código: {code}" em texto discreto quando presente
  primary: ReactNode        // <Link> ou <button> já estilizado com `primary-action`
  secondary?: ReactNode     // idem com `secondary-action`
/>
```

Estrutura: `<section>` cartão (`rounded-card border-kotta-border bg-kotta-surface`), glifo inline
decorativo (`aria-hidden`) por `kind`, `<h1>` com o título, `<p>` texto, ações lado a lado (coluna em
375px, `min-h-11`), `<p class="text-xs text-kotta-muted">Código: …</p>`. Só tokens `kotta-*`.

## `components/app/route-error.tsx` (`"use client"`)

```tsx
<RouteError error={error} retry={retry} homeHref="/" homeLabel="Ir para o Painel" | "Ir para o início" />
```

- `console.error("[app] erro na tela", { digest, message })` uma vez por erro (como hoje).
- `kind = errorKind({ digest: error.digest, isOnline })`; `code` = código da API (digest
  `API_ERROR:…`) ou `error.digest`.
- Ações: "Tentar de novo" (`retry()`); para `unexpected`, também o link `homeHref`.

## Arquivos de rota

| Arquivo | Tipo | Conteúdo |
|---|---|---|
| `app/error.tsx` | client | `<main>` público + `<RouteError homeHref="/" homeLabel="Ir para o início">` |
| `app/(conta)/error.tsx` | client | `<RouteError homeHref="/" homeLabel="Ir para o Painel">` |
| `app/global-error.tsx` | client | `<html lang="pt-BR"><body>` próprios, `import "./globals.css"`, `<title>Algo deu errado — Kotta Groups</title>`, `<RouteError … "Ir para o início">` |
| `app/not-found.tsx` | server (async) | `metadata` (título + `robots: { index: false, follow: false }`); `<PublicFrame>` + `ErrorState kind="not-found"` com "Ir para o Painel" se há cookie de sessão, senão "Ir para o início" (ambos `/`) + `<BackButton>` |
| `app/(conta)/not-found.tsx` | server | `ErrorState kind="not-found"` texto "Esse item não existe ou você não tem acesso a ele.", "Ir para o Painel" (`/`) + `<BackButton>`; renderiza dentro do `AppShell` via layout |
| `app/(acesso)/sessao-expirada/page.tsx` | server | `metadata.title = "Sua sessão expirou — Kotta Groups"`; `ErrorState kind="session-expired"` com `<Link href="/entrar?motivo=…&next=…">Entrar de novo</Link>` |

`components/app/back-button.tsx` (`"use client"`): `history.length > 1 ? history.back() : location.assign(fallbackHref)`.

`components/app/public-frame.tsx` (server): o cartão com logo de `app/(acesso)/layout.tsx`, que
passa a usá-lo.

## Removidos

`components/app/load-error.tsx`, `lib/load-error.ts`, `lib/load-error.test.mjs` (substituídos por
`route-error.tsx`, `lib/error-state.ts`, `lib/error-state.test.mjs`).

## `lib/error-state.ts`

```ts
export const API_ERROR_DIGEST = "API_ERROR:";           // formato API_ERROR:<status>:<code>
export type ErrorKind = "not-found" | "session-expired" | "offline" | "unavailable" | "unexpected";
export const ERROR_COPY: Record<ErrorKind, { title: string; text: string }>;
export function apiErrorFromDigest(digest?: string): { status: number; code: string } | undefined;
export function errorKind(input: { digest?: string; isOnline: boolean }): ErrorKind;
```

`lib/api/errors.ts`: `ApiError.digest = \`${API_ERROR_DIGEST}${status}:${code}\`` sempre;
`UNAVAILABLE_CODES` passa para `lib/error-state.ts` (único dono).

## Copy (pt-BR, sentence case)

| kind | title | text padrão |
|---|---|---|
| not-found | Página não encontrada | Essa página não existe ou mudou de lugar. |
| session-expired | Sua sessão expirou | Entre de novo para continuar de onde parou. |
| offline | Sem conexão | Verifique sua internet e tente de novo. |
| unavailable | O Kotta Groups está fora do ar | *(friendlyMessage(code))* |
| unexpected | Algo deu errado | Tivemos um problema ao abrir esta tela. Tente de novo. |

Ações: "Tentar de novo", "Ir para o Painel", "Ir para o início", "Voltar", "Entrar de novo".
Aviso do watcher: "Sua sessão vai expirar em 2 minutos. Salve o que estiver fazendo."

## Acessibilidade

`h1` único por tela; ações com foco visível (`focus-visible:outline-*` já nas classes
`primary-action`/`secondary-action`); glifo `aria-hidden`; aviso do watcher `role="status"`; layout
em coluna a 375px sem rolagem horizontal.
