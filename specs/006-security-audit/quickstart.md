# Quickstart: validar a auditoria de segurança

Pré-requisitos: `pnpm` 11, `node`, `gh` autenticado, checkout de `main` limpo.

## 1. Skill instalada (US2 / FR-001)

```bash
test -f .agents/skills/security-audit/SKILL.md
node -e "const s=require('./skills-lock.json').skills['security-audit'];console.log(s.source,s.skillPath)"
grep -n "security-audit" AGENTS.md
```

Esperado: `cloudflare/security-audit-skill skills/security-audit/SKILL.md` e a linha no `AGENTS.md`.

## 2. Dependências, lint e testes (US1)

```bash
pnpm install --frozen-lockfile
pnpm audit --prod --json | node -e "process.stdin.on('data',d=>b+=d);let b='';process.stdin.on('end',()=>console.log(JSON.parse(b).metadata.vulnerabilities))"
pnpm audit --json | node -e "process.stdin.on('data',d=>b+=d);let b='';process.stdin.on('end',()=>console.log(JSON.parse(b).metadata.vulnerabilities))"
pnpm lint; pnpm test
```

Esperado: contagens por severidade iguais às do comentário na #10.

## 3. Run da skill (US2 / FR-007, FR-008)

```bash
RUN=~/security-audit-skill/app-kottagroups/run-1
SKILL=.agents/skills/security-audit
node -e "console.log(require('$RUN/run-metadata.json').run_status)"
node $SKILL/validate-findings.cjs $RUN/findings.json
node $SKILL/validate-coverage-ledger.cjs $RUN/coverage-ledger.json
```

Esperado: status `complete` (ou `incomplete` com `incomplete_reason`) e os dois validadores com
código de saída 0. Conferir no ledger as superfícies da tabela em [data-model.md](data-model.md).

## 4. Nada da auditoria no repo (SC-006)

```bash
git status --porcelain | grep -Ei "findings|coverage-ledger|run-metadata|REPORT" && echo FAIL || echo OK
```

## 5. Rastreabilidade (US3, US4)

```bash
node -e "const f=require('$HOME/security-audit-skill/app-kottagroups/run-1/findings.json');console.log(f.filter(x=>x.verdict==='confirmed').map(x=>x.fingerprint).join('\n'))" \
  | while read fp; do gh issue list --search "$fp in:body" --state all --json number -q '.[].number'; done
gh issue view 10 --comments | grep -n "Checagem na CI"
```

Esperado: uma issue por fingerprint confirmado; comentário na #10 segue
[contracts/tracker-comment.md](contracts/tracker-comment.md).
