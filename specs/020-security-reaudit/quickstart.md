# Quickstart: validar a re-auditoria

Pré-requisitos: `pnpm` 11, `node`, `gh` autenticado, checkout de `main` limpo, run-1 presente em
`~/security-audit-skill/app-kottagroups/run-1`.

```bash
RUN=~/security-audit-skill/app-kottagroups/run-2
PREV=~/security-audit-skill/app-kottagroups/run-1
SKILL=.agents/skills/security-audit
```

## 1. Dependências, lint e testes (US2 / FR-004, FR-005)

```bash
mkdir -p $RUN/deps && pnpm install --frozen-lockfile
pnpm audit --prod --json > $RUN/deps/audit-prod.json; pnpm audit --json > $RUN/deps/audit-all.json
for f in audit-prod audit-all; do node -e "for (const r of ['$PREV','$RUN']) console.log('$f', r.split('/').pop(), JSON.stringify(require(r+'/deps/$f.json').metadata.vulnerabilities))"; done
pnpm lint > $RUN/deps/lint.log 2>&1; echo lint=$?; pnpm test > $RUN/deps/test.log 2>&1; echo test=$?
```

Esperado: contagens e diferença iguais às da issue de acompanhamento.

## 2. Rodada da skill (US1 / FR-001, FR-002, FR-006, FR-007)

```bash
node -e "const m=require('$RUN/run-metadata.json');console.log(m.run_status,m.incomplete_reason??'',m.source_ref)"
node $SKILL/validate-findings.cjs $RUN/findings.json
node $SKILL/validate-coverage-ledger.cjs $RUN/coverage-ledger.json
```

Esperado: `complete` (ou `incomplete` + motivo) e os dois validadores com saída 0.

Herdados revalidados (SC-002):

```bash
for fp in 006/safe-next-ascii-whitespace-open-redirect 006/safe-next-login-action-redirect-variant 006/bff-shared-rate-limit-identity; do
  grep -q "$fp" $RUN/findings.json $RUN/coverage-ledger.json && echo "ok $fp" || echo "FALTA $fp"; done
```

Superfícies novas (SC-001): conferir no ledger cada linha da tabela em
[data-model.md](data-model.md#registro-de-cobertura).

## 3. Nada da auditoria no repo (FR-006)

```bash
git status --porcelain | grep -Ei "findings|coverage-ledger|run-metadata|REPORT" && echo FAIL || echo OK
```

## 4. Rastreabilidade (US3, US4)

```bash
node -e "const f=require('$RUN/findings.json');(f.findings??f).filter(x=>x.verdict==='confirmed').forEach(x=>console.log(x.fingerprint))" \
  | while read fp; do echo "$fp -> $(gh issue list --search "$fp in:body" --state all --json number -q '[.[].number]|join(",")')"; done
gh issue view 46 --comments | grep -n "Run-2"
gh issue list --label security --search "Security re-audit: run-2" --json number,title
```

Esperado: cada fingerprint confirmado com exatamente uma issue; #46 com comentário da run-2;
issue de acompanhamento segue [contracts/tracker-issue.md](contracts/tracker-issue.md).

## 5. Sem produção (SC-005)

Revisar `$RUN/REPORT.md` → seção de execução: nenhuma URL de produção chamada.
