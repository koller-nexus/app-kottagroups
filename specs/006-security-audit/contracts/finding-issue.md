# Contract: issue por achado confirmado

Uma issue por registro `verdict: confirmed` em `findings.json` (FR-010).

**Title**: `security(<overall_severity>): <title do achado>`

**Labels**: `security` (criar se não existir).

**Body**:

```markdown
Achado da auditoria de segurança (#10), run `run-<N>`.

- **Severidade**: <overall_severity> (probabilidade <likelihood.score>, impacto <impact.score>)
- **Confiança**: <confidence.score>
- **Fingerprint**: `<fingerprint>`

## Problema
<description>

## Evidência
- `<file>:<line>` — <description>   (um item por `evidence`/`trace`)

## Condições
- <conditions[].kind>: <description>

## Reprodução local
<execution.instructions> → <execution.observed_result>

## Correção sugerida
<remediation.strategy>

## API (#158)
<mesmo problema na API: `<fingerprint>` | descartado na API | não verificado na API | n/a>
```

Regras:
- MUST NOT conter segredo/token real (FR-013); descrever local e tipo, recomendar rotação.
- Dedup: se `gh issue list --search "<fingerprint> in:body" --state all` retornar algo, comentar
  na existente em vez de criar.
- A seção API só é obrigatória para achados de autenticação/sessão.
