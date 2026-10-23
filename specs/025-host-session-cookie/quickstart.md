# Quickstart: validar o cookie de sessão `__Host-`

## Pré-requisitos

- API local rodando e `API_ORIGIN` definido (ex.: `http://localhost:8085`), como nos e2e.
- Navegador Chromium ou Firefox (Safari pode recusar `Secure` em `http://localhost`, ver R5).

## Automático

```bash
pnpm lint
pnpm test                      # inclui lib/session-cookie.test.mjs
pnpm test:e2e                  # suíte inteira com o nome novo (SC-005)
pnpm build
```

Os e2e novos do FR-009 ficam em `e2e/access.spec.ts`; o de sessão vencida, em
`e2e/errors.spec.ts`.

## Manual (`pnpm dev`, `http://localhost:3002`)

1. **Login grava só o novo (US1)**: entrar; DevTools → Application → Cookies. Esperado: só
   `__Host-kotta_session`, com Secure, HttpOnly, SameSite Lax, Path `/`, sem domínio próprio.
   Formato em `contracts/session-cookie.md` "Gravar".
2. **Prefixo barra cookie com domínio ou sem Secure (US1-AS3)**: sem sessão (antes de entrar,
   porque o cookie do app é HttpOnly e já bloquearia o JS), no console de `/entrar`:
   `document.cookie = "__Host-kotta_session=x; Path=/; Domain=localhost; Secure"` e
   `document.cookie = "__Host-kotta_session=x; Path=/"`. Esperado: nenhum cookie criado. Controle:
   `document.cookie = "__Host-kotta_session=x; Path=/; Secure"` cria (apagar em seguida).
3. **Quem já estava logado continua (US2)**: copiar o valor do cookie novo, apagá-lo, criar
   `kotta_session` com o mesmo valor (Path `/`), abrir `/grupos`. Esperado: página logada; depois
   da resposta, só `__Host-kotta_session` com o mesmo valor e o mesmo vencimento.
4. **Antigo vencido (US2-AS2)**: `kotta_session` com o token vencido do `e2e/errors.spec.ts`,
   abrir `/grupos`. Esperado: `/entrar?motivo=expirada&next=%2Fgrupos`, "Sua sessão expirou",
   nenhum cookie de sessão.
5. **Sair com os dois (US3)**: logado, criar também `kotta_session` com qualquer valor; clicar
   "Sair". Esperado: `/entrar?motivo=saiu`, nenhum dos dois cookies; `/grupos` pede login.

## Depois do merge

- Issue de remoção da leitura do antigo aberta com a data do R7 (FR-008).
- Em produção, conferir no DevTools que o cookie é `__Host-kotta_session` e que não há pico de
  logins nas 24 h seguintes (SC-002).
