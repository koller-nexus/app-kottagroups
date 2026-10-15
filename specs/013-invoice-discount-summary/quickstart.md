# Quickstart: validar valor dos itens e desconto

## Automático

```bash
pnpm test        # invoiceSummary: casos de contracts/invoice-summary.md
pnpm lint && pnpm build
# e2e (precisa de E2E_EMAIL/E2E_PASSWORD e da API local):
API_ORIGIN=http://localhost:8085 E2E_PORT=3217 pnpm test:e2e e2e/notes-notifications.spec.ts
```

## Manual

| # | Passo | Esperado |
|---|-------|----------|
| 1 | Abrir `http://localhost:3002/grupos/01M4XR232WCQ9HCM087DKD4DA2/notas/01M4XREAWVHESAGCY3RCN5WFFZ` | Valor dos itens R$ 104,15 · Desconto −R$ 4,15 · Total da nota R$ 100,00; sem aviso |
| 2 | Somar a coluna Total da tabela | Igual a "Valor dos itens" (SC-001) |
| 3 | Nota sem desconto | Sem linha "Desconto" (FR-004) |
| 4 | Nota com item faltando (simulada no e2e) | Aviso com a diferença (US2) |
| 5 | Viewport de 360 px | Resumo em uma coluna, sem rolagem horizontal |
