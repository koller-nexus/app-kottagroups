---

description: "Task list for the front-end security audit (issue #10)"
---

# Tasks: Auditoria de segurança do front

**Input**: Design documents from `/specs/006-security-audit/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Não pedidos na spec. A verificação é feita pelos validadores da skill e por `quickstart.md`.

**Organization**: Tarefas agrupadas por história de usuário.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história da spec (US1–US4)

## Path Conventions

- Repo: `.agents/skills/`, `skills-lock.json`, `AGENTS.md`
- Fora do repo (nunca versionar): `RUN=~/security-audit-skill/app-kottagroups/run-1`
- Artefatos intermediários de dependências: `$RUN/deps/`
- Publicação no GitHub (comentários, issues) MUST ser confirmada pelo mantenedor antes de cada envio.

---

## Phase 1: Setup

**Purpose**: Branch e pasta de saída

- [X] T001 Criar o branch `feature/006-security-audit` a partir de `main` atualizado (`git switch -c feature/006-security-audit`) e anotar o SHA de `main` (`git rev-parse main`) para `source_ref`
- [X] T002 Criar a pasta de saída fora do repo `~/security-audit-skill/app-kottagroups/run-1/deps/` (N=1: a pasta `app-kottagroups` ainda não existe; se existir, usar o próximo `run-<N>` livre)

---

## Phase 2: Foundational

**Purpose**: Nenhum pré-requisito comum além do Setup. US1 e US2 são independentes entre si.

**Checkpoint**: Setup pronto → US1 e US2 podem começar em paralelo.

---

## Phase 3: User Story 1 - Dependências vulneráveis (Priority: P1) 🎯 MVP

**Goal**: Resumo por severidade de `pnpm audit` (prod e completo) + lint + testes publicado na #10.

**Independent Test**: Passo 2 do `quickstart.md`; as contagens batem com o comentário na #10.

- [X] T003 [US1] Rodar `pnpm install --frozen-lockfile`; se falhar, registrar o erro em `$RUN/deps/install.log` e parar US1
- [X] T004 [P] [US1] Rodar `pnpm audit --prod --json > $RUN/deps/audit-prod.json` (código de saída ≠ 0 é esperado quando há vulnerabilidades; repetir uma vez em erro de rede, depois registrar "não executado" com o erro)
- [X] T005 [P] [US1] Rodar `pnpm audit --json > $RUN/deps/audit-all.json` com a mesma regra de T004
- [X] T006 [P] [US1] Rodar `pnpm lint > $RUN/deps/lint.log 2>&1` e `pnpm test > $RUN/deps/test.log 2>&1`; registrar passou/falhou de cada um (falha já existente em `main` não bloqueia)
- [X] T007 [P] [US1] Rodar `trivy fs --scanners vuln,secret . > $RUN/deps/trivy.txt`; registrar `semgrep: não executado (não instalado)` — não instalar
- [X] T008 [US1] Extrair de `metadata.vulnerabilities` em `$RUN/deps/audit-prod.json` e `$RUN/deps/audit-all.json` as contagens `critical, high, moderate, low, info`, e listar cada pacote alto/crítico de produção como `pacote@versão → versão corrigida` (de `advisories`) em `$RUN/deps/summary.md`
- [X] T009 [US1] Montar o comentário da #10 em `$RUN/tracker-comment.md` seguindo `specs/006-security-audit/contracts/tracker-comment.md` (seção "Dependências" preenchida; demais seções como "em andamento"); conferir que não há segredo nem token (FR-013)
- [ ] T010 [US1] Após confirmação do mantenedor, publicar com `gh issue comment 10 --repo koller-nexus/app-kottagroups --body-file $RUN/tracker-comment.md`

**Checkpoint**: US1 entregue e verificável sozinha.

---

## Phase 4: User Story 2 - Auditoria guiada do código-fonte (Priority: P1)

**Goal**: Skill instalada e listada; rodada `standard` concluída (ou `incomplete` com motivo) e validadores passando.

**Independent Test**: Passos 1, 3 e 4 do `quickstart.md`.

### Instalação da skill

- [X] T011 [US2] Instalar a skill com `pnpm dlx skills add cloudflare/security-audit-skill --skill security-audit` gerando `.agents/skills/security-audit/` e a entrada em `skills-lock.json` com `source: cloudflare/security-audit-skill`, `sourceType: github`, `skillPath: skills/security-audit/SKILL.md`. Se o CLI falhar ou criar arquivos fora de `.agents/skills/` e `skills-lock.json`, reverter e copiar `../api-kottagroups/.agents/skills/security-audit/` + a entrada `security-audit` do `../api-kottagroups/skills-lock.json`
- [X] T012 [US2] Anotar se o `computedHash` em `skills-lock.json` difere de `a9e78b86beae8fcb24212824239a4f8a84f5f29748fea90119cb7b52a9244586` (hash do `api-kottagroups`) para citar no PR
- [X] T013 [US2] Adicionar em `AGENTS.md`, dentro de `## Installed skills`, a subseção `### Security` com `- @.agents/skills/security-audit/SKILL.md` e a frase "Use when asked for a security audit, security review, or defensive pen test of this code." — sem tocar no bloco gerado pelo `next dev`
- [X] T014 [US2] Rodar os testes da própria skill (`node --test .agents/skills/security-audit/*.test.cjs`) para confirmar que os validadores funcionam neste ambiente

### Rodada da skill

- [X] T015 [US2] Escrever `$RUN/run-metadata.json` com `run_id: "run-1"`, `repo: "app-kottagroups"`, `target` = caminho absoluto do repo, `source_ref` = SHA de T001, `profile: "standard"`, `scope_paths: ["."]`, `budget: 30`, `execution_policy: "sandboxed-source-and-local-only"`, `companions: ["WEB-PROTOCOL-AND-AUTH.md","CLIENT-SIDE.md","DATA-ISOLATION-AND-LIFECYCLE.md","CLOUD-AND-DEPLOYMENT.md","SUPPLY-CHAIN-AND-RELEASE.md"]`, `prior_runs: []`, `related_tracking` = issue #10 e api-kottagroups#158, `run_status: "in_progress"`
- [X] T016 [US2] Fase 1 (Reconhecimento) seguindo `.agents/skills/security-audit/RECONNAISSANCE.md`: semear `$RUN/coverage-ledger.json` garantindo ≥1 unidade para cada superfície da tabela em `specs/006-security-audit/data-model.md` (cookie/sessão, proxy, open redirect, Server Actions, vazamento de token/erro, `NEXT_PUBLIC_*`/bundle, XSS, headers, NFC-e)
- [X] T017 [US2] Fases 2–3 (ondas de caça + validação de candidatos) seguindo `HUNTING.md`, `ATTACK-CLASSES.md` e os companions de T015; sem nenhuma requisição a Vercel ou à API de produção (FR-009); respeitar o orçamento de 30 invocações
- [X] T018 [US2] Fases 4–6: escrever `$RUN/findings.json` (só `confirmed`, `needs_validation`, `rejected`), `$RUN/REPORT.md` e atualizar `run_status` para `complete` ou `incomplete` + `incomplete_reason` em `$RUN/run-metadata.json`
- [X] T019 [US2] Rodar `node .agents/skills/security-audit/validate-findings.cjs $RUN/findings.json` e `node .agents/skills/security-audit/validate-coverage-ledger.cjs $RUN/coverage-ledger.json`; corrigir os artefatos até os dois saírem com código 0 (ou registrar o motivo de `incomplete`)
- [X] T020 [US2] Conferir no `$RUN/coverage-ledger.json` que as 9 superfícies de FR-006 têm estado terminal com achado ou justificativa (SC-001)
- [X] T021 [US2] Atualizar a seção "Skill `security-audit`" em `$RUN/tracker-comment.md` (run, status, validadores, n/9 superfícies)

**Checkpoint**: Skill instalada, rodada validada.

---

## Phase 5: User Story 3 - Achados viram trabalho rastreável (Priority: P2)

**Goal**: Uma issue por achado `confirmed`; lista de `needs_validation` na #10; cruzamento com a API.

**Independent Test**: Passo 5 do `quickstart.md`.

**Depende de**: US2 (findings.json validado).

- [X] T022 [US3] Para cada achado de auth/sessão em `$RUN/findings.json`, comparar com `~/security-audit-skill/api-kottagroups/run-9/findings.json` e `NEEDS-VALIDATION.md` e classificar como `mesmo problema na API: <fingerprint>` | `descartado na API` | `não verificado na API` (run-9 está `incomplete`; não verificado → também vai para a lista de validação)
- [X] T023 [US3] Garantir que o label `security` existe (`gh label create security --repo koller-nexus/app-kottagroups --color B60205` se faltar), após confirmação
- [X] T024 [US3] Para cada registro `verdict: "confirmed"`, buscar duplicata com `gh issue list --repo koller-nexus/app-kottagroups --search "<fingerprint> in:body" --state all`; se existir, comentar na existente; senão escrever `$RUN/issues/<fingerprint>.md` no formato de `specs/006-security-audit/contracts/finding-issue.md` (título `security(<overall_severity>): <title>`, sem segredos — FR-013)
- [X] T025 [US3] Após confirmação do mantenedor, criar as issues com `gh issue create --repo koller-nexus/app-kottagroups --label security --title ... --body-file $RUN/issues/<fingerprint>.md` e registrar `fingerprint → #número` em `$RUN/issues/index.md`
- [X] T026 [US3] Preencher em `$RUN/tracker-comment.md` as seções "Achados confirmados" (`#issue — severidade — título`, ou "Nenhum achado confirmado.") e "Precisam de validação" (título + fato faltante de `blockers`/`validation_plan`)

**Checkpoint**: Todo achado confirmado rastreável (SC-002).

---

## Phase 6: User Story 4 - Decisão sobre checagem na CI (Priority: P3)

**Goal**: Decisão registrada na #10; issue separada se "sim".

**Independent Test**: A #10 mostra a decisão; se "sim", existe issue linkada.

**Depende de**: US1 e US2.

- [X] T027 [US4] Aplicar o critério de `specs/006-security-audit/research.md` R9: "sim" se houver vulnerabilidade alta/crítica de produção (T008) ou achado `confirmed` detectável por análise estática; senão "não por enquanto" com motivo
- [ ] T028 [US4] Se "sim", após confirmação, abrir issue `ci: add security check workflow` descrevendo `pnpm audit --prod --audit-level high` em `.github/workflows/security.yml` rodando em PR e quando falhar; não criar o workflow nesta feature
- [X] T029 [US4] Preencher a seção "Checagem na CI" em `$RUN/tracker-comment.md`

---

## Phase 7: Polish & Cross-Cutting

- [ ] T030 Após confirmação, atualizar o comentário da #10 com a versão final: `gh issue comment 10 --repo koller-nexus/app-kottagroups --edit-last --body-file $RUN/tracker-comment.md`
- [X] T031 Rodar `quickstart.md` de ponta a ponta e o passo 4 (nenhum artefato da auditoria em `git status`, SC-006)
- [X] T032 Rodar `pnpm lint` e `pnpm test` no branch (mudança só em `.agents/skills/`, `skills-lock.json`, `AGENTS.md`)
- [ ] T033 Commitar (`chore: add security-audit skill`, inglês, Conventional Commits) apenas `.agents/skills/security-audit/`, `skills-lock.json`, `AGENTS.md` e `specs/006-security-audit/`; abrir PR referenciando #10, citando o hash da skill (T012) e o resumo da auditoria

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → bloqueia tudo.
- **US1 (T003–T010)** e **US2 (T011–T021)**: independentes, podem rodar em paralelo.
- **US3 (T022–T026)**: depende de US2.
- **US4 (T027–T029)**: depende de US1 e US2.
- **Polish (T030–T033)**: depende de todas. T030 depende de T010 (`--edit-last` edita o comentário de T010).

Dentro das histórias: T008 depende de T004–T005; T015–T020 são sequenciais (fases da skill); T025 depende de T023–T024.

## Parallel Example

```bash
# US1, após T003:
pnpm audit --prod --json > $RUN/deps/audit-prod.json &   # T004
pnpm audit --json > $RUN/deps/audit-all.json &           # T005
pnpm lint > $RUN/deps/lint.log 2>&1 &                    # T006
trivy fs --scanners vuln,secret . > $RUN/deps/trivy.txt & # T007
wait

# Em paralelo com US1: T011–T014 (instalação da skill)
```

## Implementation Strategy

- **MVP**: Setup + US1 → resumo de dependências na #10 em minutos.
- **Incremento 2**: US2 → skill instalada e rodada validada (núcleo da issue).
- **Incremento 3**: US3 → issues por achado.
- **Incremento 4**: US4 + Polish → decisão de CI, comentário final, PR.
