# Data Model: Endurecimento da re-auditoria (run-2)

Sem armazenamento novo. Entidades da spec e o que muda em cada uma:

## Sessão

- **Onde**: cookie `kotta_session` (navegador) + sessão na API (identificada pelo bearer).
- **Transições**:

| Ação | Antes | Depois |
|------|-------|--------|
| Sair (`logoutAction`, POST) | só o cookie é apagado | `POST /auth/logout` com o bearer (até 3 s, erro ignorado) e depois o cookie é apagado |
| `/sair` (GET, por link) | apaga o cookie só se a API recusa o token | sem mudança |

## Token de link

| Tipo | Onde aparece | Proteção nova |
|------|--------------|---------------|
| Convite | `/convite/<token>`; `?next=%2Fconvite%2F<token>` em `/entrar` e `/cadastrar` | analytics sem query e com o caminho mascarado |
| Redefinição de senha | `/redefinir-senha?token=` | analytics sem query; token sai da barra após a leitura; `no-referrer` |
| Confirmação de e-mail | `/confirmar-email?token=` | igual à redefinição |

## Código de erro

- **Formato**: `^[A-Z0-9_]{1,64}$` (`ERROR_CODE_PATTERN`).
- **Validação**: no limite de entrada, dentro de `friendlyMessage`. Fora do formato, a pessoa vê
  só a mensagem genérica.

## URL de arquivo da API

- **Campos**: `ApiReceiptFile.url` (nota do grupo e nota da lista), `avatarUrl` da pessoa.
- **Validação**: `httpsUrl()` antes de renderizar. Fora de `https:` (ou `http:` em loopback:
  `localhost`, `127.0.0.1`, `[::1]`), aparece o substituto já
  existente.
