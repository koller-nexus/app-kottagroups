# Implementation Plan: Mostrar a foto enviada na tela da nota

**Branch**: `feature/012-receipt-photo-preview` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-receipt-photo-preview/spec.md`

## Summary

A tela `/grupos/{id}/notas/{notaId}` passa a mostrar a foto enviada numa coluna à direita, fixa
enquanto a pessoa rola os itens, para conferir a leitura contra o papel ("a ideia é ter a foto ali,
para fazer uma checagem"). No celular a foto vem logo depois dos dados lidos.

A API ainda não expõe o arquivo da nota de grupo. O plano tem duas partes:

1. **API (`api-kottagroups`)**: `GET /api/v1/invoices/{id}` passa a devolver
   `file: { contentType, sizeBytes, url } | null`, no mesmo formato do comprovante da lista. A `url`
   é assinada com HMAC e vale por pouco tempo. Uma rota nova serve o arquivo do disco. Ver
   [contracts/invoice-file.md](./contracts/invoice-file.md).
2. **Web (este repo)**: o tipo `ApiInvoice` ganha `file`, a página troca para duas colunas quando há
   arquivo e um componente cliente pequeno mostra a foto, com aviso quando ela não carrega.

## Technical Context

**Language/Version**: TypeScript 5 (web), Go (API)

**Primary Dependencies**: Next.js App Router (instalado), React, Tailwind CSS; Gin na API

**Storage**: arquivo da nota em disco (`InvoiceService.uploadDir`, campo `StoredPath`); nenhuma
mudança de schema

**Testing**: `pnpm test` (`lib/*.test.mjs`, `node:test`), Playwright em `e2e/` com API mock; `go test` na API

**Target Platform**: navegador (desktop e celular), servidor Next.js

**Project Type**: aplicação web + API separada

**Performance Goals**: foto visível em até 2 s (SC-004); a página não espera a imagem para renderizar

**Constraints**: sem dependência nova; sem link público permanente (FR-009); sem rolagem horizontal
em 360 px (SC-003)

**Scale/Scope**: 1 página, 1 componente cliente, 1 helper puro; na API, 1 campo e 1 rota

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|-----------|-------------|--------|
| I. Simplicity First | Reaproveita o padrão de `ReceiptPreview` (lista) e o formato `ApiReceiptFile`; usa `<img>` nativo; nenhuma dependência; sem visualizador próprio (ampliar = nova aba) | ✅ |
| II. Clean Code | Helper `invoiceFileKind` com nome claro; componente da foto < 60 linhas; página continua abaixo de 200 linhas | ✅ |
| III. Organized Structure | Componente em `components/app/` ao lado de `invoice-*`; helper em `lib/invoices.ts` | ✅ |
| IV. Best Practices | Página continua Server Component; `"use client"` só no componente da foto (precisa de `onError`); `alt` descritivo; foco visível no link; tokens `kotta-*` | ✅ |
| IV. Segurança | URL assinada e temporária, emitida só depois do controle de acesso da nota (`readable`); rota de arquivo valida assinatura e caminho | ✅ |
| IV. VERSION | Não existe arquivo `VERSION` (TODO já registrado na constituição) | ➖ |
| V. Testable by Default | Teste de `invoiceFileKind` em `lib/invoices.test.mjs`; cenário e2e com a API mock; teste Go da assinatura e do campo `file` | ✅ |

Nenhuma violação. Complexity Tracking vazio.

**Re-check pós-design**: mantido. O design adiciona só um campo opcional ao tipo e uma rota de leitura na API.

## Project Structure

### Documentation (this feature)

```text
specs/012-receipt-photo-preview/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── invoice-file.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
# Web (este repo)
lib/api/types.ts                                  # ApiInvoice.file?: ApiReceiptFile | null
lib/invoices.ts                                   # invoiceFileKind(file) → "image" | "pdf" | null
lib/invoices.test.mjs                             # teste do helper
components/app/invoice-photo.tsx                  # "use client": <a><img onError/></a> ou link do PDF
app/(conta)/grupos/[id]/notas/[notaId]/page.tsx   # duas colunas quando há arquivo
e2e/mock-api-*.ts + e2e/<spec de notas>           # nota com file.url mockado

# API (../api-kottagroups)
internal/service/invoice.go          # InvoiceView.File, assinado em Get
internal/storage/sign.go             # SignedInvoiceURL (mesma HMAC de SignReadQuery)
internal/http/invoice_handler.go     # invoiceSignedFile: GET /api/v1/invoices/files/:file
internal/http/router.go              # registra a rota
api/openapi.yaml                     # schema Invoice.file + rota
```

**Structure Decision**: aplicação web existente (Next.js, App Router) mais a API Go no repositório
irmão. A mudança na API precisa ir para produção antes, ou junto, porque o web só mostra a coluna
quando `file` vem preenchido. Sem `file`, a tela fica como hoje e nada quebra.

## Complexity Tracking

Sem violações.
