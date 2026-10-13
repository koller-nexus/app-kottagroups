# Data Model: Auditoria de segurança do front

Nenhum dado do app muda. As entidades são artefatos da auditoria; os formatos de `findings.json` e
`coverage-ledger.json` são os da skill (`report-schema.json`, validadores) — não redefinidos aqui.

## Rodada de auditoria (`run-metadata.json`)

| Campo | Valor nesta feature |
|-------|---------------------|
| `run_id` | `run-1` |
| `repo` | `app-kottagroups` |
| `source_ref` | SHA de `main` |
| `profile` | `standard` |
| `scope_paths` | `["."]` |
| `budget` | `30` |
| `execution_policy` | `sandboxed-source-and-local-only` |
| `related_tracking` | issue #10; API #158 |
| `run_status` | `in_progress` → `complete` \| `incomplete` (+ `incomplete_reason`) |

## Achado (registro em `findings.json`)

- `verdict`: `confirmed` | `needs_validation` | `rejected`.
- `confirmed` exige `severity.overall_severity` (`informational`…`critical`), `confidence`,
  `trace`, `evidence`, `execution`, `remediation`.
- `needs_validation` exige `blockers` e `validation_plan` → viram o "fato faltante" na #10.
- `fingerprint`: chave de deduplicação nas issues.

Transições: `candidate` (ledger) → `confirmed` | `needs_validation` | `rejected`. Só `confirmed`
gera issue; `needs_validation` vai para a lista da #10; `rejected` fica só no relatório.

## Registro de cobertura (`coverage-ledger.json`)

Cada superfície de FR-006 MUST mapear para ≥1 unidade do ledger com estado terminal (coberta com
achado, coberta sem achado, ou `deferred`/`out_of_scope` com motivo). Tabela de mapeamento:

| Superfície (FR-006) | Arquivos-alvo |
|---------------------|---------------|
| Cookie de sessão / criação e encerramento | `lib/api/session.ts`, `app/actions/auth.ts`, `app/sair/route.ts` |
| Checagem otimista no proxy | `proxy.ts` |
| Open redirect | `lib/safe-next.ts`, `proxy.ts` |
| Server Actions | `app/actions/*.ts` |
| Vazamento de token/erro da API | `lib/api/server.ts`, `lib/api/*` |
| `NEXT_PUBLIC_*` e segredos no bundle | `next.config.ts`, uso de `process.env` |
| XSS | componentes que renderizam dados da API, notas, OCR |
| Headers de segurança | `next.config.ts`, `vercel.json` |
| Upload/leitura NFC-e | `lib/receipt.ts`, `app/actions/invoices.ts`, leitor QR (`jsqr`) |

## Resumo de dependências

`{ recorte: "prod" | "all", critical, high, moderate, low, info }` + `lint: pass|fail`,
`test: pass|fail`, `trivy: executado|não executado`, `semgrep: não executado`.
