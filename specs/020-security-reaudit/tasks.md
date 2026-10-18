---

description: "Task list for the front-end security re-audit (run-2)"
---

# Tasks: Re-auditoria de segurança do front

**Input**: Design documents from `/specs/020-security-reaudit/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Não pedidos na spec. A verificação é feita pelos validadores da skill e por `quickstart.md`.

**Organization**: Tarefas agrupadas por história de usuário.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história da spec (US1–US4)

## Path Conventions

- Fora do repo (nunca versionar): `RUN=~/security-audit-skill/app-kottagroups/run-2`,
  `PREV=~/security-audit-skill/app-kottagroups/run-1`, `SKILL=.agents/skills/security-audit`
- Artefatos de dependências: `$RUN/deps/`
- Nenhum arquivo de app muda (FR-012). No repo só `specs/020-security-reaudit/`.
- Publicação no GitHub (issues, comentários) MUST ser confirmada pelo mantenedor antes de cada envio.
- Zero requisições a Vercel ou à API de produção (FR-008).

---

## Phase 1: Setup

**Purpose**: Branch e pasta de saída

- [X] T001 Criar o branch `feature/020-security-reaudit` a partir de `main` atualizado (`git switch -c feature/020-security-reaudit`) e anotar `git rev-parse main` como `source_ref` (esperado `36f6150…`; se `main` mudou, usar o SHA novo em todos os artefatos)
- [X] T002 Criar `~/security-audit-skill/app-kottagroups/run-2/deps/` (próximo `run-<N>` livre; se `run-2` já existir, usar o seguinte e ajustar `$RUN`) e confirmar que `$PREV/findings.json` e `$PREV/coverage-ledger.json` existem

---

## Phase 2: Foundational

**Purpose**: Metadados da rodada, que US1 e US3/US4 usam. US2 não depende desta fase.

- [X] T003 Escrever `$RUN/run-metadata.json` conforme `specs/020-security-reaudit/data-model.md`: `run_id: "run-2"`, `repo: "app-kottagroups"`, `target` (raiz absoluta do repo), `source_ref` (de T001, com flag de worktree sujo), `profile: "standard"`, `scope_paths: ["."]`, `budget: 30`, `execution_policy: "sandboxed-source-and-local-only"`, `prior_runs: [$PREV]`, companions de `research.md` R3, `run_status: "in_progress"`
- [X] T004 Registrar em `$RUN/run-metadata.json` (ou `$RUN/architecture.md`) que o host não aplica o sandbox exigido pela skill → rodada só por leitura + expressões Node stdlib sobre literais (`research.md` R4)

**Checkpoint**: Setup + T003/T004 → US1 pode começar; US2 pode começar logo após T002.

---

## Phase 3: User Story 1 - Rodada que parte da anterior (Priority: P1) 🎯 MVP

**Goal**: Rodada `standard` completa (ou incompleta com motivo) cobrindo as 8 superfícies de FR-003 e revalidando os itens da run-1.

**Independent Test**: Passo 2 do `quickstart.md`: validadores com saída 0, os 3 fingerprints herdados presentes e cada superfície do `data-model.md` com resultado no ledger.

- [X] T005 [US1] Fase 1 da skill (`$SKILL/RECONNAISSANCE.md`): mapear fronteiras de confiança e escrever `$RUN/architecture.md`, partindo de `$PREV/architecture.md` e atualizando com o que entrou nas features 007–019 (convites, tokens de e-mail, QR de imagem, `/api/notas/status`, aviso de sessão entre abas, avatar)
- [X] T006 [US1] Carregar a run-1 conforme `$SKILL/SKILL.md` "Coverage and prior runs": comparar o código atual de cada registro de `$PREV/findings.json` e de cada unidade de `$PREV/coverage-ledger.json`; `006/safe-next-ascii-whitespace-open-redirect` vira unidade de revalidação (`app/sair/route.ts`, `app/actions/auth.ts`, `proxy.ts` mudaram); `006/safe-next-login-action-redirect-variant` e `006/bff-shared-rate-limit-identity` viram trabalho atual; nenhum entra na lista de exclusão dos caçadores
- [X] T007 [US1] Montar `$RUN/coverage-ledger.json` determinístico com ≥1 unidade por linha da tabela "Registro de cobertura" de `specs/020-security-reaudit/data-model.md` (8 superfícies) + as unidades herdadas de T006 + as demais superfícies do repo; validar o planejamento com `node $SKILL/validate-coverage-ledger.cjs $RUN/coverage-ledger.json`
- [X] T008 [US1] Aplicar o gate de orçamento (`budget: 30`): reservar 4 agentes de reconhecimento, 1 crítico pós-onda + 1 crítico final e verificadores (~30% do saldo); se não couber, propor escopo menor ao mantenedor antes de lançar qualquer agente
- [X] T009 [US1] Fase 2 (`$SKILL/HUNTING.md`, `$SKILL/ATTACK-CLASSES.md` + companions): lançar caçadores isolados por unidade do ledger em ordem de prioridade (convites e tokens na URL, ações do servidor, `/api/notas/status`, redirecionamentos e proxy primeiro), cada um com raiz própria em `$RUN/agents/<id>/`; rodar o crítico de cobertura após cada onda e atualizar o ledger só pelo pai
- [X] T010 [US1] Fase 3 (`$SKILL/VALIDATION-AND-REPORTING.md`): consolidar candidatos por fingerprint em `$RUN/candidates.json` e dar cada um a um verificador novo; itens que dependem de execução, da hospedagem ou da API ficam `needs_validation` com bloqueio exato e plano seguro
- [X] T011 [US1] Fase 4: escrever `$RUN/findings.json` com todos os registros finais (`confirmed`, `needs_validation`, `rejected`), incluindo o estado atual dos 3 fingerprints herdados; rodar `node $SKILL/validate-findings.cjs $RUN/findings.json` e `node $SKILL/validate-coverage-ledger.cjs $RUN/coverage-ledger.json` até ambos saírem com código 0
- [X] T012 [US1] Fase 5: verificação independente de cada registro final por agentes novos; reconciliar correções no `findings.json` e repetir os validadores
- [X] T013 [US1] Fase 6: gerar `$RUN/REPORT.md`, `$RUN/FINDINGS-DETAIL.md` e `$RUN/NEEDS-VALIDATION.md` a partir dos registros; no `REPORT.md` incluir a tabela "Itens da run-1" (ainda presente / corrigido / descartado) e a seção de execução declarando zero URLs de produção (SC-005); definir `run_status` final (`complete` ou `incomplete` + `incomplete_reason` + fases concluídas + unidades não cobertas) em `$RUN/run-metadata.json`

**Checkpoint**: run-2 terminal e validada → US3 e US4 podem começar.

---

## Phase 4: User Story 2 - Dependências vulneráveis (Priority: P1)

**Goal**: Contagens por severidade (prod e completo) comparadas com a run-1, mais lint, testes e trivy.

**Independent Test**: Passo 1 do `quickstart.md`; contagens e diferença batem com `$RUN/deps/summary.md`.

- [X] T014 [US2] Rodar `pnpm install --frozen-lockfile > $RUN/deps/install.log 2>&1`; se falhar, registrar o erro e parar US2
- [X] T015 [P] [US2] Rodar `pnpm audit --prod --json > $RUN/deps/audit-prod.json` (saída ≠ 0 é esperada com vulnerabilidades; repetir uma vez em erro de rede, depois registrar "não executado" com o erro em `$RUN/deps/audit-prod.err`)
- [X] T016 [P] [US2] Rodar `pnpm audit --json > $RUN/deps/audit-all.json` com a mesma regra de T015
- [X] T017 [P] [US2] Rodar `pnpm lint > $RUN/deps/lint.log 2>&1` e `pnpm test > $RUN/deps/test.log 2>&1`; registrar passou/falhou (falha já existente em `main` não bloqueia)
- [X] T018 [P] [US2] Rodar `trivy fs --scanners vuln,secret . > $RUN/deps/trivy.txt 2> $RUN/deps/trivy.err`; registrar `semgrep: não executado (não instalado)`, sem instalar
- [X] T019 [US2] Escrever `$RUN/deps/summary.md`: contagens `critical, high, moderate, low, info` de `metadata.vulnerabilities` de cada recorte; lista "novas desde a run-1" e "sumiram desde a run-1" comparando os IDs de `advisories` com `$PREV/deps/audit-prod.json` e `$PREV/deps/audit-all.json`; cada pacote alto/crítico de produção como `pacote@versão → versão corrigida`; resultado de lint, testes e trivy

**Checkpoint**: resumo de dependências pronto (independe de US1).

---

## Phase 5: User Story 3 - Achados viram trabalho rastreável (Priority: P2)

**Goal**: Uma issue de acompanhamento nova, a #46 atualizada e uma issue por achado confirmado novo, sem duplicatas.

**Independent Test**: Passo 4 do `quickstart.md`: cada fingerprint confirmado com exatamente uma issue; #46 com comentário da run-2; issue de acompanhamento no formato de `contracts/tracker-issue.md`.

- [X] T020 [US3] Para cada achado de sessão, autenticação ou convite em `$RUN/findings.json`, ler `~/security-audit-skill/api-kottagroups/run-14/findings.json` e `NEEDS-VALIDATION.md` e anotar `mesmo problema na API: <fingerprint>` | `descartado na API` | `não verificado na API` em `$RUN/issues/api-crossref.md`
- [X] T021 [US3] Para cada registro `confirmed`, rodar `gh issue list --repo koller-nexus/app-kottagroups --search "<fingerprint> in:body" --state all`; montar em `$RUN/issues/<fingerprint-slug>.md` o corpo de issue nova (`specs/020-security-reaudit/contracts/finding-issue.md`) ou, se já existir issue, o comentário `Run-2 (<sha>): <ainda presente | corrigido | descartado> — <evidência>`
- [X] T022 [US3] Montar `$RUN/issues/issue-46-comment.md` com o estado da run-2 para `006/safe-next-ascii-whitespace-open-redirect` (de T011/T013)
- [X] T023 [US3] Montar o corpo da issue de acompanhamento em `$RUN/tracker-issue.md` seguindo `specs/020-security-reaudit/contracts/tracker-issue.md` com dados de `$RUN/deps/summary.md`, `$RUN/REPORT.md` e `$RUN/NEEDS-VALIDATION.md` (números copiados do JSON, nunca estimados; seção "Endurecimento" preenchida em US4)
- [X] T024 [US3] Revisar todos os arquivos em `$RUN/issues/` e `$RUN/tracker-issue.md` com `grep -nEi "eyJ|token=|secret|password|Bearer "` e leitura manual: nenhum segredo, token real ou dado de usuário real (FR-011); tokens de exemplo só fictícios
- [X] T025 [US3] Após confirmação do mantenedor, criar a issue de acompanhamento (`gh issue create --repo koller-nexus/app-kottagroups --label security --title "Security re-audit: run-2 do front (main @ <sha curto>)" --body-file $RUN/tracker-issue.md`), comentar na #46 (`gh issue comment 46 --body-file $RUN/issues/issue-46-comment.md`) e criar/comentar as issues de T021; anotar os números em `$RUN/issues/published.md` e atualizar `$RUN/tracker-issue.md` com os links (`gh issue edit`)

**Checkpoint**: backlog rastreável publicado.

---

## Phase 6: User Story 4 - Endurecimento priorizado (Priority: P3)

**Goal**: Cada nota de endurecimento (run-1 + novas) com decisão, motivo e issue se "adotar".

**Independent Test**: Seção "Endurecimento" da issue de acompanhamento com uma linha por nota; cada "adotar" com issue própria.

- [X] T026 [US4] Reavaliar contra o código atual as 3 notas da run-1 (cabeçalhos CSP/`frame-ancestors`/HSTS/`Referrer-Policy` em `next.config.ts`/`vercel.json`; cookie `__Host-` + `secure` sempre em `lib/api/session.ts`; confirmação extra para trocar a chave Pix em `app/actions/auth.ts`/perfil) e as notas novas de `$RUN/REPORT.md`; decidir adotar/não com o critério de `research.md` R8 e escrever em `$RUN/issues/hardening.md`
- [X] T027 [US4] Para cada "adotar", montar o corpo da issue em `$RUN/issues/hardening-<slug>.md` (o que muda, onde, por que, sem segredos) e, após confirmação do mantenedor, criá-la com `gh issue create --label security`; preencher a seção "Endurecimento" da issue de acompanhamento (`gh issue edit <n> --body-file $RUN/tracker-issue.md`)

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T028 Rodar os passos 2–5 de `specs/020-security-reaudit/quickstart.md` e corrigir qualquer divergência
- [X] T029 Confirmar que nada da rodada está no repo (`git status --porcelain | grep -Ei "findings|coverage-ledger|run-metadata|REPORT"` vazio) e que só `specs/020-security-reaudit/` mudou
- [X] T030 Marcar as tarefas concluídas neste `specs/020-security-reaudit/tasks.md`, commitar `specs/020-security-reaudit/` no branch `feature/020-security-reaudit` e, com confirmação do mantenedor, abrir o PR referenciando a issue de acompanhamento

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → tudo.
- **Foundational (T003–T004)** → US1.
- **US2 (T014–T019)**: só depende de T002; roda em paralelo com US1.
- **US1 (T005–T013)**: sequencial (fases da skill em ordem; o pai é o único escritor dos arquivos compartilhados).
- **US3 (T020–T025)**: depende de US1 (T013) e de US2 (T019).
- **US4 (T026–T027)**: depende de US1 (T013) e de T023/T025 (issue de acompanhamento existente).
- **Polish (T028–T030)**: depois de todas.

```text
T001 → T002 ─┬→ T003 → T004 → T005 → … → T013 ─┬→ T020 → … → T025 → T026 → T027 → T028 → T030
             └→ T014 → {T015,T016,T017,T018} → T019 ┘
```

## Parallel Example

```bash
# US2, depois de T014:
pnpm audit --prod --json > $RUN/deps/audit-prod.json   # T015
pnpm audit --json > $RUN/deps/audit-all.json            # T016
pnpm lint > $RUN/deps/lint.log 2>&1; pnpm test > $RUN/deps/test.log 2>&1   # T017
trivy fs --scanners vuln,secret . > $RUN/deps/trivy.txt 2> $RUN/deps/trivy.err   # T018
```

Em US1, os caçadores de T009 rodam em paralelo dentro de cada onda (um por unidade do ledger), mas as fases T005→T013 são sequenciais.

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 + US2. Entrega a rodada validada e o resumo de dependências em `$RUN`, sem publicar nada.
2. **Incremento 2**: US3, que publica o backlog no GitHub após confirmação.
3. **Incremento 3**: US4, decisões de endurecimento.
4. Se a rodada terminar `incomplete`, seguir para US3 mesmo assim, com o motivo e as unidades não cobertas na issue de acompanhamento.
