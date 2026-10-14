# Quickstart: validar a feature 010

## Pré-requisitos
`pnpm install`; variáveis de e2e como em `.github/workflows/e2e.yml`.

## 1. Regras
```bash
pnpm test
```
Esperado: casos de `canLinkInvoice` (done/needs_review, failed com e sem `expenseId`, queued, processing).

## 2. Qualidade
```bash
pnpm lint && pnpm build
```

## 3. E2E
```bash
pnpm test:e2e e2e/notes-notifications.spec.ts
```
Esperado:
- nota `failed` sem vínculo: mensagem de erro, explicação, formulário "Foto da nota", sem seção "Despesa";
- nota `queued`/`processing`: sem "Despesa";
- nota `done` sem despesas livres: uma única mensagem sobre registrar despesa.

## 4. Manual
Abrir uma nota com falha no celular: enviar outra foto leva à nota nova; grupo arquivado não mostra o formulário.
