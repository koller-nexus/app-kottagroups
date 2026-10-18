# Contract: issue de acompanhamento da run-2

Uma issue nova (a #10 está fechada) que fecha FR-010 / SC-006. Editada, não duplicada, se a
rodada for refeita.

**Title**: `Security re-audit: run-2 do front (main @ <sha curto>)`

**Labels**: `security`

**Body**:

```markdown
Segunda rodada da auditoria de segurança (spec `specs/020-security-reaudit`). Rodada anterior: #10 (run-1).

### Dependências (`pnpm audit`)
| Recorte | Crítica | Alta | Moderada | Baixa |
|---------|---------|------|----------|-------|
| Produção | n | n | n | n |
| Completo | n | n | n | n |

Novas desde a run-1: <pacote@versão (advisory) | nenhuma>
Sumiram desde a run-1: <… | nenhuma>
<alta/crítica em produção: pacote@versão → versão corrigida>

Lint: <passou|falhou> · Testes: <passou|falhou> · trivy: <resultado|não executado> · semgrep: não executado

### Skill `security-audit`
Run `run-2` (`standard`), status `<complete|incomplete: motivo>`.
Validadores: findings <ok|erro>, coverage <ok|erro>.
Superfícies novas (FR-003): <n>/8 com resultado no ledger.

### Itens da run-1
| Item | Estado na run-2 | Issue |
|------|-----------------|-------|
| Open redirect `/sair` | <ainda presente|corrigido|descartado> | #46 |
| Redirect pós-login | <…> | <#n | —> |
| Limite por IP compartilhado | <…> | <#n | —> |

### Achados confirmados novos
- #<issue> — <severidade> — <título>   (ou "Nenhum achado confirmado novo.")

### Precisam de validação
- <título> — falta: <fato> — plano: <validação segura>

### Endurecimento
| Nota | Decisão | Motivo | Issue |
|------|---------|--------|-------|
| Cabeçalhos de segurança (CSP, frame-ancestors, HSTS, Referrer-Policy) | <adotar|não> | … | <#n> |
| Cookie `__Host-` + `secure` sempre | … | … | … |
| Confirmação extra para trocar chave Pix | … | … | … |
```

Regras: sem segredos, tokens reais ou dados de usuários (FR-011); números copiados do JSON, nunca
estimados; etapa que não rodou aparece como "não executado" com o erro.
