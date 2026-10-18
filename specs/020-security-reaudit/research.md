# Research: Re-auditoria de segurança do front

Base: [research da 006](../006-security-audit/research.md). Abaixo só o que muda ou se confirma.

## R1. Skill

- **Decision**: usar `.agents/skills/security-audit/` como está; não reinstalar nem atualizar.
- **Rationale**: a spec assume a skill da 006. Atualizar mudaria o contrato dos validadores no
  meio da comparação com a run-1.
- **Alternatives**: `pnpm dlx skills add ...` para pegar a versão nova; fica para outra feature.

## R2. Rodada e rodada anterior

- **Decision**: `run-2` (próximo número livre), perfil `standard`, `scope_paths: ["."]`,
  `source_ref: 36f6150` (ou o SHA de `main` no início da rodada), orçamento 30,
  `execution_policy: sandboxed-source-and-local-only`, `prior_runs: ["run-1"]`.
- **Rationale**: a skill exige ler ledgers/findings anteriores compatíveis; regras de carry-over:
  - `confirmed` com código relevante inalterado → carregado, revalidado por verificador novo.
  - código relevante mudou → unidade de revalidação nova (não entra na lista de exclusão).
  - `needs_validation`, `deferred`, `blocked` → trabalho atual.
- **Situação conhecida**: `lib/safe-next.ts` não mudou desde a run-1 (último commit `caf7302`
  anterior a ela), mas `app/sair/route.ts`, `app/actions/auth.ts` e `proxy.ts` mudaram →
  o achado herdado entra como revalidação, não como carry-over automático.
- **Alternatives**: `deep` (custo alto); `quick` (cobertura parcial; falha SC-001).

## R3. Companions

- **Decision**: `WEB-PROTOCOL-AND-AUTH.md`, `CLIENT-SIDE.md`, `DATA-ISOLATION-AND-LIFECYCLE.md`,
  `CLOUD-AND-DEPLOYMENT.md`, `SUPPLY-CHAIN-AND-RELEASE.md` (iguais à run-1) +
  `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` (upload de foto e polling de status).

## R4. Execução local

- **Decision**: só leitura do código + expressões Node stdlib sobre literais, como na run-1.
- **Rationale**: o host macOS não aplica o sandbox exigido (sem rede externa, env vazio, alvo
  read-only, limites). A skill manda registrar itens dependentes de execução como
  `needs_validation` com plano seguro.

## R5. Dependências

- **Decision**: `pnpm install --frozen-lockfile`; `pnpm audit --prod --json` e
  `pnpm audit --json`; contagens de `metadata.vulnerabilities`; diff por `advisories` contra
  `run-1/deps/`. `trivy fs --scanners vuln,secret .`. Saídas em `run-2/deps/`.
- **Rationale**: FR-004 pede comparação; a run-1 guardou as saídas em `deps/`.

## R6. Rastreamento no GitHub

- **Decision**: a #10 está fechada → criar uma issue nova de acompanhamento
  ([contracts/tracker-issue.md](contracts/tracker-issue.md)). Achado herdado já tem issue
  (#46, aberta): comentar nela o estado atual, não criar outra. Achados novos: um por issue
  ([contracts/finding-issue.md](contracts/finding-issue.md)), dedup por fingerprint. Toda
  publicação é confirmada pelo mantenedor no momento.
- **Alternatives**: reabrir a #10; rejeitado, mistura duas rodadas no mesmo histórico.

## R7. Cruzamento com a API

- **Decision**: ler a rodada mais recente da API (`~/security-audit-skill/api-kottagroups/run-14`)
  só para achados de sessão, autenticação e convite; marcar
  `mesmo problema na API` | `descartado na API` | `não verificado na API`.
- **Rationale**: convites e tokens de e-mail são validados pela API; o front só repassa.

## R8. Endurecimento (US4)

- **Decision**: reavaliar as 3 notas da run-1 (cabeçalhos de segurança; cookie `__Host-` +
  `secure` sempre; confirmação extra para trocar chave Pix) + qualquer nova da run-2. Critério
  "adotar": fecha um vetor plausível com mudança pequena. Cada "adotar" vira issue.
