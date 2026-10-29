# Data model: status das notas em lote

Nada é guardado. Só um tipo novo, de leitura.

## InvoiceStatusItem

| Campo | Tipo | Origem |
|-------|------|--------|
| `id` | string (ULID canônico) | API |
| `status` | `ApiInvoiceStatus` (`queued`, `processing`, `done`, `failed`, `needs_review`) | API |

Declarado em `lib/api/types.ts` como `ApiInvoiceStatusItem`. A API devolve
`{ items: ApiInvoiceStatusItem[] }`, e a rota repassa a mesma lista à tela.

## Validação de `ids` (`parseStatusIds`)

| Entrada | Resultado |
|---------|-----------|
| `null` ou `""` | `null` (400) |
| um id vazio (`a,,b`) | `null` |
| algum id fora de `^[0-7][0-9A-HJKMNP-TV-Z]{25}$` (minúsculas, 25/27 caracteres, `I`/`L`/`O`/`U`, primeiro caractere `8`–`Z`, `../users`) | `null` |
| mais de 20 ids distintos | `null` |
| 1 a 20 ids válidos, com repetidos | a lista sem repetidos, na ordem da primeira ocorrência |
