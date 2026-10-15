---

description: "Task list for 012-receipt-photo-preview"
---

# Tasks: Mostrar a foto enviada na tela da nota

**Input**: Design documents from `/specs/012-receipt-photo-preview/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/invoice-file.md, quickstart.md

**Tests**: incluídos porque a constituição (Princípio V) exige teste para comportamento novo. Os
caminhos `api/` referem-se ao repositório irmão `../api-kottagroups`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Criar a branch `feature/012-receipt-photo-preview` a partir de `main` neste repo e em `../api-kottagroups` — web a partir de `feature/011-receipt-reading-progress` e API (`feature/062-invoice-file-url`) a partir de `feature/061-receipt-reading-speed`, porque nenhuma das duas está na base ainda

---

## Phase 2: Foundational (API: bloqueia todas as histórias)

**Purpose**: a API precisa devolver `file` e servir o arquivo assinado ([contracts/invoice-file.md](./contracts/invoice-file.md)).

- [X] T002 [P] Adicionar `SignedInvoiceURL(baseURL, file string, secret []byte, ttl time.Duration)` em `../api-kottagroups/internal/storage/sign.go`, assinando com `SignReadQuery(secret, invoiceID, file, exp)` e gerando `/api/v1/invoices/files/{file}?exp=&sig=`, com TTL padrão de 15 min
- [X] T003 [P] Teste de `SignedInvoiceURL`: a assinatura vale com `VerifyReadQuery` e falha depois de `exp`, em `../api-kottagroups/internal/storage/sign_test.go`
- [X] T004 Adicionar `File *InvoiceFileJSON` (`contentType`, `sizeBytes`, `url` opcional) a `InvoiceView` e preencher em `InvoiceService.Get`, `LinkExpense` e `UnlinkExpense`. Regra: `file` = `null` quando `StoredPath` não é um arquivo local em `uploadDir` (nota pelo QR code); `url` fica ausente se a assinatura falhar, com log `invoice_read_url_failed`. Injetar `baseURL`, HMAC e TTL em `NewInvoiceService`. Arquivos: `../api-kottagroups/internal/service/invoice.go` e o wiring em `../api-kottagroups/cmd/` — feito com `SetFileSigning` (setter, como `proc.SetCache`) em vez de mudar `NewInvoiceService`; lógica em `internal/service/invoice_file.go`
- [X] T005 Teste: `Get` devolve `file` com `contentType` = `MimeType` e `url` assinada para uma nota com foto, e `file: null` para uma nota com `StoredPath` de QR, em `../api-kottagroups/internal/service/invoice_test.go` — `internal/service/invoice_file_test.go`
- [X] T006 Criar o handler `invoiceSignedFile` (`GET /api/v1/invoices/files/:file`, sem Bearer) em `../api-kottagroups/internal/http/invoice_handler.go`. O handler aceita só o nome `ULID + .jpg|.png|.webp|.pdf`, rejeita `..` e `/`, verifica a HMAC (401 se inválida ou expirada), lê `uploadDir/{file}` (404 se não existir) e responde com o `Content-Type` detectado, `Cache-Control: private, max-age=60` e `X-Content-Type-Options: nosniff`. Registrar a rota em `../api-kottagroups/internal/http/router.go` — validação de nome e assinatura em `InvoiceService.SignedFilePath`; handler só serve o arquivo
- [X] T007 Teste do handler: 200 com assinatura válida, 401 expirada ou adulterada, 404 sem arquivo, 400/404 com nome inválido (`../x`), em `../api-kottagroups/internal/http/invoice_handler_test.go`
- [X] T008 [P] Documentar `Invoice.file` e a rota `GET /api/v1/invoices/files/{file}` em `../api-kottagroups/api/openapi.yaml`

**Checkpoint**: `go test ./...` passa; `GET /invoices/{id}` de uma nota com foto traz `file.url` que abre a imagem.

---

## Phase 3: User Story 1 - Ver a foto ao lado da leitura (Priority: P1) 🎯 MVP

**Goal**: foto inteira na coluna direita, acompanhando a rolagem, em qualquer estado da nota.

**Independent Test**: abrir uma nota enviada como foto em tela ≥ 1024 px e ver a imagem ao lado de totais e itens; em 360 px, a foto vem depois dos dados, sem rolagem horizontal.

- [X] T009 [P] [US1] Adicionar `file?: ApiReceiptFile | null` a `ApiInvoice`, com comentário "null quando a nota veio pelo QR code; url assinada e temporária", em `lib/api/types.ts`
- [ ] T010 [P] [US1] Teste de `invoiceFileKind`: `null`/`undefined` → `null`; `image/jpeg`, `image/png` e `image/webp` → `"image"`; `application/pdf` → `"pdf"`; `text/plain` → `null`. Em `lib/invoices.test.mjs` — **Não feito (dispensado)**: notas de grupo e de lista só guardam imagem (`invoiceAllowedMIME`: jpeg, png, webp, tiff); PDF nunca vira nota. A decisão virou `invoice.file ?` direto, sem helper para testar
- [ ] T011 [US1] Implementar `invoiceFileKind(file)` em `lib/invoices.ts` para fazer T010 passar — **Não feito (dispensado)**: ver T010
- [X] T012 [US1] Criar `components/app/invoice-photo.tsx` (`"use client"`), com props `file: ApiReceiptFile` e `name: string`. Para imagem com `url`: `<a href target="_blank" rel="noopener noreferrer">` com foco visível (`focus-visible:outline-kotta-primary`) envolvendo `<img alt={\`Foto da nota ${name}\`} className="w-full object-contain lg:max-h-[calc(100vh-3rem)]">`, com o mesmo comentário e eslint-disable de `ReceiptPreview`. Em `onError` ou sem `url`, mostrar "Não foi possível carregar a foto." (`text-sm text-kotta-muted`). Usar só tokens `kotta-*`, `rounded-control` e `border-kotta-border` — aria-label da coluna e alt usam "Foto enviada" para não colidir com o campo "Foto da nota" do envio
- [X] T013 [US1] Em `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx`, calcular `const fileKind = invoiceFileKind(invoice.file)`. Com `fileKind`, usar `width="view"` e envolver o conteúdo atual num grid `lg:grid-cols-[minmax(0,1fr)_22rem] gap-8 lg:gap-12`: coluna esquerda `flex flex-col gap-8 lg:gap-12` com tudo o que existe hoje; `<aside aria-label="Foto da nota" className="lg:sticky lg:top-6 lg:self-start">` com `<InvoicePhoto>` depois, na ordem do DOM. Sem `fileKind`, manter `width="reading"` e a estrutura atual, sem nenhuma diferença
- [ ] T014 [US1] Adicionar ao mock `e2e/mock-api-proxy.ts` uma nota de grupo com `file: { contentType: "image/png", sizeBytes, url }`, apontando para uma imagem servida pelo próprio mock, e uma nota sem `file` — **Não precisou**: o proxy já aceita sobrescrever qualquer campo da nota (`/__mock/invoice/{id}`) e o teste usa uma imagem `data:`
- [X] T015 [US1] Cenário e2e em `e2e/notes-notifications.spec.ts`: na nota com foto, `getByRole("img", { name: "Foto da nota …" })` fica visível em viewport 1280 px; em 360 px, `document.documentElement.scrollWidth <= 360`; na nota sem `file`, não há `aside` "Foto da nota" — escrito; não rodou localmente (credenciais `E2E_EMAIL`/`E2E_PASSWORD` só no CI)

**Checkpoint**: US1 entregável sozinha (MVP).

---

## Phase 4: User Story 2 - Ampliar a foto (Priority: P2)

**Goal**: ativar a foto abre o original numa nova aba.

**Independent Test**: clicar na foto ou usar Tab + Enter e ver a imagem em nova aba.

- [X] T016 [US2] No cenário e2e de `e2e/notes-notifications.spec.ts`, verificar que o link da foto tem `href` = `file.url`, `target="_blank"` e alcançável por teclado (`focus()` + `toBeFocused()`) — no mesmo cenário de T015; não rodou localmente

---

## Phase 5: User Story 3 - Nota sem imagem ou com PDF (Priority: P3)

**Goal**: sem coluna para nota via QR; link "Abrir PDF" para PDF; aviso quando a foto não carrega.

**Independent Test**: nota QR sem coluna; nota PDF com "Abrir PDF"; URL quebrada mostra "Não foi possível carregar a foto."

- [ ] T017 [US3] Em `components/app/invoice-photo.tsx`, ramo PDF: aceitar `kind: "image" | "pdf"` e, para `"pdf"` com `url`, renderizar o link "Abrir PDF" (`target="_blank" rel="noopener noreferrer"`, classes de link existentes); sem `url`, o mesmo aviso de T012 — **Não feito (dispensado)**: sem PDF em nota (ver T010). TIFF, que não abre em todo navegador, cai no aviso com o link "Abrir foto"
- [X] T018 [US3] Adicionar ao `e2e/mock-api-proxy.ts` uma nota PDF e uma nota com `file.url` que responde 404; em `e2e/notes-notifications.spec.ts`, verificar "Abrir PDF" e "Não foi possível carregar a foto." — no mesmo cenário de T015 (TIFF que não renderiza e `file: null`); não rodou localmente

---

## Phase 6: Polish & Cross-Cutting

- [X] T019 Rodar `pnpm lint && pnpm test && pnpm build` e corrigir o que falhar — `pnpm lint`, `pnpm test`, `pnpm build`, `go test ./...` e `make lint` passam
- [ ] T020 Validar manualmente os cenários 1–10 de `specs/012-receipt-photo-preview/quickstart.md` com a API local — **Pendente**: precisa da API local reiniciada com a branch `feature/062-invoice-file-url`
- [X] T021 Conferir que `app/(conta)/grupos/[id]/notas/[notaId]/page.tsx` continua abaixo de 200 linhas. Se passar, extrair o conteúdo da coluna esquerda para um componente em `components/app/` — bloco da leitura extraído para `components/app/invoice-reading.tsx`; página com 144 linhas

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (API) → US1 → US2 / US3 → Polish.
- US1 funciona no web antes da API (`file` é opcional), mas só mostra a foto depois da Phase 2 em produção. O e2e de US1 usa o mock e não depende da API real.
- US2 depende do componente de T012. US3 estende T012, então T017 vem depois de T012.
- Dentro da Phase 2: T002/T003 → T004/T005 → T006/T007; T008 em paralelo.

### Parallel Opportunities

- T002, T003 e T008 (arquivos diferentes na API).
- T009 e T010 (tipos e teste) em paralelo com toda a Phase 2.

```text
# US1 em paralelo:
T009 lib/api/types.ts
T010 lib/invoices.test.mjs
```

## Implementation Strategy

1. **MVP** = Phase 2 + US1: foto ao lado para conferir. Fazer o deploy da API primeiro e depois do web.
2. US2 e US3 são pequenos incrementos no mesmo componente e podem ir no mesmo PR do web.
3. Commits em inglês (Conventional Commits): `feat(api): expose signed invoice file`, `feat: show uploaded receipt photo beside the reading`.
