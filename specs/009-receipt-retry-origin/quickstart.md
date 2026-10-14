# Quickstart: validar a feature 009

## Pré-requisitos
- `pnpm install`; `API_ORIGIN`, `E2E_EMAIL`, `E2E_PASSWORD` definidos (ver `.github/workflows/e2e.yml`) e API local no ar.

## 1. Regras (unit)
```bash
pnpm test
```
Esperado: casos novos de `resolutionPathLabel`, `canRetryReceipt` (só com `allowed`; nunca `done`/`queued`/`processing`) e `retriesLeftLabel` (singular/plural) passam.

## 2. Qualidade
```bash
pnpm lint && pnpm build
```

## 3. Fluxo ponta a ponta (API simulada para a nota)
```bash
pnpm test:e2e e2e/receipt-retry.spec.ts
```
Esperado:
- nota `failed` com 2 tentativas → botão "Tentar de novo" e "2 tentativas restantes";
- clique → botão desabilitado → "Lendo sua nota…" → `done` com itens e selo "Lido pelo QR code";
- nota `failed` com retry recusado `RECEIPT_RETRY_LIMIT` → "Você já usou todas as tentativas para esta nota";
- nota `failed` com `allowed: false` → explicação + opções de foto/QR, sem botão;
- nota `done`/`queued` → sem botão; `queued` sem itens.

## 4. Manual (opcional)
Abrir uma lista com nota em falha na API real e conferir o botão, o selo e a ausência de texto em inglês.
