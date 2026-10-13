# Contract: comentário de resultado na issue #10

Um comentário único (editado se precisar refazer) que fecha SC-004.

```markdown
## Resultado da auditoria de segurança — `main` @ <sha curto>

### Dependências (`pnpm audit`)
| Recorte | Crítica | Alta | Moderada | Baixa |
|---------|---------|------|----------|-------|
| Produção | n | n | n | n |
| Completo | n | n | n | n |

<alta/crítica em produção: pacote@versão → versão corrigida>

Lint: <passou|falhou> · Testes: <passou|falhou> · trivy: <resultado|não executado> · semgrep: não executado

### Skill `security-audit`
Run `run-<N>` (`standard`), status `<complete|incomplete: motivo>`.
Validadores: findings <ok|erro>, coverage <ok|erro>.
Superfícies prioritárias: <n>/<n> com resultado no ledger.

### Achados confirmados
- #<issue> — <severidade> — <título>   (ou "Nenhum achado confirmado.")

### Precisam de validação
- <título> — falta: <fato>   (de `blockers`/`validation_plan`)

### Checagem na CI
<Sim → #<issue> | Não por enquanto: motivo>
```

Regras: sem segredos (FR-013); números copiados do JSON, nunca estimados; se uma etapa não rodou,
dizer "não executado" com o erro.
