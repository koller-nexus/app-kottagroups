# Contrato: `GET /api/notas/status?ids=…` (rota do app)

O formato para a tela não muda (FR-002). Só a validação do id fica mais estrita (research R2).

## Pedido

`ids`: ids de nota separados por vírgula, de 1 a 20 depois de remover repetidos, cada um no formato
ULID canônico (`^[0-7][0-9A-HJKMNP-TV-Z]{25}$`).

## Respostas (todas com `Cache-Control: no-store`)

| Situação | Status | Corpo |
|----------|--------|-------|
| ids ausentes, mais de 20 ou algum fora do formato | 400 | `{ "error": "Invalid ids" }` (antes de chamar a API) |
| sem sessão | 401 | `{ "error": "Session expired" }` |
| sessão expirada na API | redirecionamento do `apiRequest`, como hoje | — |
| sucesso | 200 | `{ "items": [{ "id", "status" }] }`, só as notas devolvidas pela API |
| a API falha ou recusa (400, 429, 5xx) | 503 | `{ "error": "Service unavailable" }` |

## Chamada à API (uma por pedido, FR-001)

`GET /api/v1/invoices/status?ids=<ids sem repetidos, unidos por vírgula>`

Resposta: `{ "data": { "items": [{ "id": string, "status": ApiInvoiceStatus }] } }`. A ordem não
importa. Notas desconhecidas, excluídas ou sem acesso são omitidas. Contrato completo em
`api-kottagroups/api/openapi.yaml` (`/api/v1/invoices/status`).
