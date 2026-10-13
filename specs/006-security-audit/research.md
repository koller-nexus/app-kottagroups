# Research: Auditoria de segurança do front

Todas as incógnitas do Technical Context resolvidas abaixo.

## R1. Como instalar a skill

- **Decision**: `pnpm dlx skills add cloudflare/security-audit-skill --skill security-audit` (mesmo
  CLI que gerou o `skills-lock.json` atual). Entrada esperada no lock:
  `source: cloudflare/security-audit-skill`, `sourceType: github`,
  `skillPath: skills/security-audit/SKILL.md`. Se o CLI falhar, copiar
  `../api-kottagroups/.agents/skills/security-audit/` e a entrada do lock de lá
  (`computedHash a9e78b86…`).
- **Rationale**: FR-001 exige mesma origem e registro do `api-kottagroups`; o lock lá aponta para
  exatamente essa origem/caminho. Hash diferente do da API é aceitável (upstream pode ter mudado) e
  fica registrado no PR.
- **Alternatives**: submódulo git ou só `.claude/skills/` — rejeitados, divergem do padrão do repo.

## R2. Onde listar a skill

- **Decision**: nova subseção `### Security` em `## Installed skills` do `AGENTS.md`, com
  `- @.agents/skills/security-audit/SKILL.md` e uma linha: usar quando pedirem auditoria/revisão de
  segurança.
- **Rationale**: o bloco do topo do `AGENTS.md` é regenerado pelo `next dev`; a seção de skills não.

## R3. Auditoria de dependências

- **Decision**: `pnpm install --frozen-lockfile`, `pnpm audit --prod --json` e `pnpm audit --json`;
  contagens por severidade extraídas do JSON (`metadata.vulnerabilities`). Lint/test via
  `pnpm lint` e `pnpm test`.
- **Rationale**: o repo usa `pnpm@11.22.0` e tem `pnpm-lock.yaml`; JSON evita contagem manual.
- **Alternatives**: `npm audit` (lockfile errado), Snyk (dependência/conta nova — viola princípio I).

## R4. Ferramentas opcionais

- **Decision**: rodar `trivy fs --scanners vuln,secret .` (instalado em `/opt/homebrew/bin`).
  `semgrep` não está instalado → registrar "não executado"; não instalar.
- **Rationale**: spec diz "só se já estiverem instaladas".

## R5. Perfil, orçamento e companions da skill

- **Decision**: perfil `standard`, `scope_paths: ["."]`, `source_ref` = SHA de `main`, orçamento de
  30 invocações de agente (mesmo teto da run-9 da API). Companions: `WEB-PROTOCOL-AND-AUTH.md`,
  `CLIENT-SIDE.md`, `DATA-ISOLATION-AND-LIFECYCLE.md`, `CLOUD-AND-DEPLOYMENT.md`,
  `SUPPLY-CHAIN-AND-RELEASE.md`. `execution_policy: sandboxed-source-and-local-only`.
- **Rationale**: front Next.js com sessão por cookie, Server Actions, deploy Vercel e deps npm.
  Orçamento explícito permite à skill encerrar como `incomplete` em vez de cortar evidência.
- **Alternatives**: `quick` (cobertura parcial, não atende SC-001); `deep` (custo alto sem motivo).

## R6. Saída fora do repo

- **Decision**: `~/security-audit-skill/app-kottagroups/run-1` (pasta ainda não existe → N=1).
  Antes de commitar, `git status` limpo de artefatos de auditoria (SC-006).

## R7. Cruzamento com a API (#158)

- **Decision**: ler `~/security-audit-skill/api-kottagroups/run-9/findings.json` e
  `NEEDS-VALIDATION.md` (run `standard`, status `incomplete`). Cada achado de auth/sessão do front
  recebe: `mesmo problema na API: <fingerprint>` | `descartado na API` | `não verificado na API`.
- **Rationale**: FR-011; a run-9 é o resultado mais recente ligado à #158.

## R8. Publicação no GitHub

- **Decision**: `gh issue comment 10` para o resumo e `gh issue create` por achado `confirmed`,
  seguindo `contracts/`. Antes de criar, `gh issue list --search "<fingerprint> in:body" --state all`
  para não duplicar. Toda publicação é confirmada pelo mantenedor no momento.
- **Rationale**: `gh` já autenticado; fingerprint da skill é o identificador estável.

## R9. Checagem na CI (US4)

- **Decision**: só avaliação. Critério: se houver alguma vulnerabilidade alta/crítica em produção
  ou achado `confirmed` de classe que análise estática pegaria, recomendar "sim" e abrir issue com
  `pnpm audit --prod --audit-level high` no workflow de PR. Caso contrário, registrar "não por
  enquanto" com o motivo.
