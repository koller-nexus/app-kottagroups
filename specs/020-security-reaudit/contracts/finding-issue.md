# Contract: issue por achado confirmado

Uma issue por registro `verdict: confirmed` em `findings.json` (FR-009).

**Title**: `security(<overall_severity>): <title do achado>`

**Labels**: `security` (criar se não existir).

**Body**:

```markdown
Achado da re-auditoria de segurança (#<acompanhamento>), run `run-2`. Origem: <novo | herdado da run-1>.

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

## API
<mesmo problema na API: `<fingerprint>` | descartado na API | não verificado na API | n/a>
```

Regras:
- MUST NOT conter segredo/token real (FR-011); descrever local e tipo, recomendar rotação.
- Dedup: se `gh issue list --search "<fingerprint> in:body" --state all` retornar algo, comentar
  na existente em vez de criar.
- A seção API só é obrigatória para achados de autenticação/sessão.
- Achado herdado que já tem issue (ex.: #46): não criar outra; comentar na existente
  `Run-2 (<sha>): <ainda presente | corrigido | descartado> — <evidência>`.
- Seção API: obrigatória para sessão, autenticação e convite; referência à rodada da API lida.
