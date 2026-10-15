# Quickstart: validar a foto na tela da nota

## Pré-requisitos

- API local (`../api-kottagroups`) com a rota e o campo de [contracts/invoice-file.md](./contracts/invoice-file.md)
  e a chave HMAC configurada (a mesma dos comprovantes).
- Web em `http://localhost:3002` apontando para a API local (`API_ORIGIN`).

## Testes automáticos

```bash
pnpm test                 # invoiceFileKind em lib/invoices.test.mjs
pnpm lint && pnpm build
pnpm exec playwright test e2e/<spec de notas>   # nota mock com file.url
cd ../api-kottagroups && go test ./internal/service/... ./internal/storage/... ./internal/http/...
```

## Cenários manuais

| # | Passo | Esperado |
|---|-------|----------|
| 1 | Enviar uma foto de cupom num grupo e abrir a nota em tela ≥ 1024 px | Foto inteira na coluna direita, ao lado de totais e itens (US1, FR-001/002/003) |
| 2 | Rolar a tabela de itens de uma nota longa | Foto continua visível ao lado (US1 cenário 4) |
| 3 | Abrir a nota enquanto está na fila/processando | Foto já aparece junto do aviso de leitura (US1 cenário 2) |
| 4 | Clicar na foto, ou focar com Tab e apertar Enter | Abre em tamanho original numa nova aba (US2, FR-005) |
| 5 | DevTools em 360 px | Uma coluna, foto depois dos dados, sem rolagem horizontal (SC-003) |
| 6 | Nota criada pelo QR code | Tela como antes, sem coluna (FR-006) |
| 7 | Nota em PDF | Link "Abrir PDF" na coluna (FR-007) |
| 8 | Abrir a nota, apagar o arquivo em `uploadDir` e recarregar | "Não foi possível carregar a foto." no lugar da imagem (FR-008) |
| 9 | Copiar `file.url`, esperar 15 min e abrir | 401 (FR-009) |
| 10 | Leitor de tela na imagem | Lê "Foto da nota IMG_0660.jpeg" (FR-004) |
