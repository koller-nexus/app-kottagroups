# Contrato: `Set-Cookie` da sessão

Formatos exatos que o app envia. `<jwt>` é o token da API; `<exp>` é o `exp` do JWT em data HTTP.

## Gravar (login, migração)

```text
Set-Cookie: __Host-kotta_session=<jwt>; Path=/; Expires=<exp>; Secure; HttpOnly; SameSite=lax
```

Sem `exp` no JWT: `Max-Age=86400` no lugar de `Expires` (o Next também emite `Expires`). Nunca
`Domain`. Igual em todos os ambientes.

## Apagar o novo

```text
Set-Cookie: __Host-kotta_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure
```

`Secure` é obrigatório (ver R1 do `research.md`); sem ele o navegador ignora e a sessão fica.

## Apagar o antigo

```text
Set-Cookie: kotta_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

## Quem envia o quê

| Ponto | Situação | Envia |
|-------|----------|-------|
| `loginAction` (via `setSessionToken`) | login ok | gravar novo + apagar antigo |
| `proxy.ts` | estados de `data-model.md` | conforme a tabela de lá |
| `logoutAction` (via `clearSessionToken`) | sair | apagar novo + apagar antigo |
| `GET /sair` | `clearCookie` de `logoutDestination` | apagar novo + apagar antigo |

Quando proxy e rota/ação enviam para o mesmo nome, os da rota vêm depois e valem (R4).

## Leitura

`readSessionToken`: valor do novo se não vazio; senão o do antigo se não vazio; senão
`undefined`. Usada em `getSessionToken`, `proxy.ts` e `GET /sair`.
