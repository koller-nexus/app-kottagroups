# Contrato: expiração de sessão

## `proxy.ts`

Entrada: cookie `kotta_session` (opcional), `pathname`, `search`.

| Situação | Resposta |
|---|---|
| sem cookie, rota em `PROTECTED` | 307 → `/entrar?motivo=expirada&next=<pathname+search>` (sem `next` para `/confirme-seu-email`) |
| cookie vencido (R1), rota em `PROTECTED` | 307 → `/entrar?motivo=expirada&next=…` **e** `Set-Cookie` apagando `kotta_session` |
| cookie vencido, rota em `GUEST_ONLY` ou pública | segue (`next()`) **e** apaga `kotta_session` |
| cookie válido, rota em `GUEST_ONLY` | 307 → `/` (como hoje) |
| demais | segue com o header `x-kotta-path` (como hoje) |

`/sessao-expirada` não está em `PROTECTED` nem em `GUEST_ONLY`.

## `lib/session-expiry.ts`

```ts
export const EXPIRY_LEEWAY_MS = 30_000;
export const EXPIRY_WARNING_MS = 120_000;
/** ms desde epoch do claim `exp`, ou undefined se o token for ilegível. Não verifica assinatura. */
export function sessionExpiresAt(token: string): number | undefined;
/** true quando o token é ilegível ou vence em até EXPIRY_LEEWAY_MS. */
export function isSessionExpired(token: string | undefined, now?: number): boolean;
/** Prazos do watcher a partir do tempo restante informado pelo servidor. */
export function watcherDeadlines(msLeft: number): { warnInMs: number; expireInMs: number };
```

## `lib/api/session.ts`

`setSessionToken(token)`: cookie com `expires = new Date(sessionExpiresAt(token))` quando legível;
senão `maxAge = 24 h`. Demais atributos iguais (httpOnly, secure em produção, sameSite lax, path /).

## `app/(conta)/layout.tsx` → `SessionWatcher`

```tsx
<SessionWatcher msLeft={expiresAt - Date.now()} />   // número; nunca o token
```

Comportamento do `SessionWatcher` (`components/app/session-watcher.tsx`, client):

1. Na montagem: `deadline = Date.now() + msLeft`; arma `warn` e `expire` com `watcherDeadlines`.
2. `warn`: mostra `<p role="status">Sua sessão vai expirar em 2 minutos. Salve o que estiver
   fazendo.</p>` no topo do conteúdo (mesmo estilo do `SubmitLostNotice`).
3. `expire` ou `Date.now() >= deadline` ao receber `visibilitychange` (visível) / `focus`:
   `window.location.assign("/entrar?motivo=expirada&next=" + encodeURIComponent(pathname + search))`.
4. Ao receber `signed-out` de outra aba: `saiu` → `/entrar?motivo=saiu`; `expirada` → como no
   passo 3, com a própria rota.
5. Desmontagem: limpa timers, listeners e fecha o canal.

## `components/auth/signed-out-broadcast.tsx` (client) em `app/(acesso)/entrar/page.tsx`

Quem avisa as outras abas é a chegada em `/entrar?motivo=saiu|expirada|envio` (`envio` vira
`expirada`): nesse ponto o cookie já foi apagado, então as outras abas passam pelo proxy. Avisar no
clique em "Sair" ou no timer do watcher criaria uma corrida: a outra aba chegaria em `/entrar`
ainda com sessão válida e seria devolvida para `/`. `logoutAction` e `LogoutButton` não mudam.
`lib/session-channel.ts` guarda o nome do canal, o tipo da mensagem e `broadcastSignedOut`.

## `app/sair/route.ts` (GET)

```ts
// lib/session-flow.ts
export function logoutDestination(input: {
  check: "valid" | "invalid" | "unknown" | "no-token";
  next: string;            // já passado por safeNextPath
  motivo: string | null;   // só "expirada" | "envio" são repassados
}): { location: string; clearCookie: boolean };
```

| `check` | `location` | `clearCookie` |
|---|---|---|
| `no-token` | `/entrar[?motivo=…][&next=…]` | false |
| `valid` | `next` | false |
| `invalid` | `/entrar[?motivo=…][&next=…]` | true |
| `unknown` | `next` | false |

`expiredSessionUrl(path, method)` não muda (`/sair?motivo=expirada|envio&next=…`).

## Fluxo de formulário recusado por 401 (sem mudança)

`apiRequest` (método ≠ GET, 401) → `/sair?motivo=envio&next=<form>?aviso=envio-nao-salvo` → `/sair`
apaga cookie → `/entrar?motivo=envio&next=…` → após login volta ao formulário, onde
`SubmitLostNotice` mostra "A sessão expirou e o envio não foi salvo. Preencha de novo."
