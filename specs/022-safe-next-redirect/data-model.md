# Data Model: destino de retorno

Sem armazenamento. A única "entidade" é um valor que atravessa a requisição.

## Destino de retorno (`next` / `returnTo`)

| Campo | Origem | Tipo na entrada |
|-------|--------|-----------------|
| `next` | query de `/sair`, `/entrar`, `/cadastrar`, `/confirme-seu-email`, `/sessao-expirada`; `formData` das ações de `app/actions/auth.ts`; cabeçalho `x-kotta-path` em `lib/api/server.ts` | `unknown` (texto, lista, `null`) |
| `returnTo` | `formData` de `app/actions/invoices.ts` | `unknown` |

**Regra de validação**: [contracts/safe-next-path.md](contracts/safe-next-path.md).

**Estados**: entra cru → sai como caminho interno normalizado ou como o destino padrão do ponto de
uso (`/`, ou `invoicePath(groupId, invoiceId)` nas notas fiscais). Nenhum outro estado; nada é
registrado.
