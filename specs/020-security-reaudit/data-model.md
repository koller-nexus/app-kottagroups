# Data Model: Re-auditoria de segurança do front

Nenhum dado do app muda. Formatos de `findings.json` e `coverage-ledger.json` são os da skill
(`report-schema.json`, validadores); entidades iguais às da
[006](../006-security-audit/data-model.md), com as diferenças abaixo.

## Rodada (`run-metadata.json`)

| Campo | Valor |
|-------|-------|
| `run_id` | `run-2` |
| `source_ref` | SHA de `main` no início (hoje `36f6150`) |
| `profile` / `scope_paths` / `budget` | `standard` / `["."]` / `30` |
| `prior_runs` | `["~/security-audit-skill/app-kottagroups/run-1"]` |
| `related_tracking` | issue de acompanhamento nova; #46 |
| `run_status` | `in_progress` → `complete` \| `incomplete` (+ `incomplete_reason`) |

## Achado

Campo extra no relatório (não no schema): **origem** = `novo` | `herdado da run-1`.

Itens herdados (FR-002) e estado esperado ao fim:

| Item run-1 | Fingerprint | Estado final possível |
|------------|-------------|------------------------|
| Open redirect `/sair` (low, #46) | `006/safe-next-ascii-whitespace-open-redirect` | ainda presente / corrigido / descartado |
| Redirect pós-login | `006/safe-next-login-action-redirect-variant` | confirmado / precisa de validação / descartado |
| Limite por IP compartilhado | `006/bff-shared-rate-limit-identity` | idem |
| Notas de endurecimento (3) | n/a | adotar / não adotar + motivo |

## Registro de cobertura

Cada superfície de FR-003 MUST mapear para ≥1 unidade com estado terminal.

| Superfície (FR-003) | Arquivos-alvo |
|---------------------|---------------|
| Convites | `app/actions/invites.ts`, `app/(acesso)/convite/[token]/page.tsx`, `lib/invites.ts`, `components/invites/*` |
| Cadastro, confirmação, redefinição | `app/(acesso)/{cadastrar,confirmar-email,confirme-seu-email,redefinir-senha}/page.tsx`, `app/actions/auth.ts`, `lib/auth-validation.ts`, `lib/confirm-email.ts`, `lib/session-flow.ts`, `components/auth/*`, `components/confirm-email/*`, `components/forget-password/*` |
| QR de imagem, foto e reenvio de nota | `components/receipt/*`, `components/forms/invoice-{upload,link}-form.tsx`, `components/app/invoice-*.tsx`, `app/actions/invoices.ts`, `lib/receipt.ts`, `lib/invoices.ts` |
| Rota de status de nota | `app/api/notas/status/route.ts`, `components/app/invoice-status-watcher.tsx`, `lib/poll-schedule.ts` |
| Erros e expiração de sessão | `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/(conta)/{error,not-found}.tsx`, `app/(acesso)/sessao-expirada/page.tsx`, `lib/error-state.ts`, `lib/session-expiry.ts`, `lib/session-channel.ts`, `components/app/session-watcher.tsx`, `components/auth/signed-out-broadcast.tsx`, `lib/api/errors.ts` |
| Avatar e imagens da API | `components/app/avatar*.tsx`, `components/forms/avatar-form.tsx`, `lib/avatar.ts`, `next.config.ts` |
| Proxy e configuração | `proxy.ts`, `next.config.ts`, `vercel.json`, `app/sair/route.ts`, `lib/safe-next.ts` |
| Ações do servidor novas/alteradas | `app/actions/{auth,categories,expenses,groups,invites,invoices,kotta,shopping}.ts`, `lib/api/{server,session,kotta}.ts`, `lib/permissions.ts` |

## Resumo de dependências

`{ recorte: "prod" | "all", critical, high, moderate, low, info }` + `novas: [advisory]`,
`sumiram: [advisory]` (vs run-1) + `lint`, `test`: `pass|fail`; `trivy`: resultado;
`semgrep`: não executado.
