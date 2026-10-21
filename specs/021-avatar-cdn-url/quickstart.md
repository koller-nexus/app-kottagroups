# Quickstart: validar a foto com endereço fixo

## Pré-requisitos

- `api-kottagroups` em `edd0405` ou depois (PR #244), rodando em `http://localhost:8085`.
- Uma conta com e-mail confirmado.

```bash
API_ORIGIN=http://localhost:8085 pnpm dev
```

## Verificações automáticas

```bash
pnpm lint && pnpm test && pnpm build
API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/profile.spec.ts
```

Esperado: o teste "trocar foto envia a imagem…" passa, com o `src` no formato de
[contracts/avatar-url.md](contracts/avatar-url.md) e sem query string.

## Verificações manuais

1. **Foto aparece (US1)**: abrir `/perfil`. A foto aparece no resumo da conta e no cabeçalho.
2. **Cache (SC-001)**: com DevTools → Network aberto (sem "Disable cache"), recarregar `/perfil`.
   A linha da imagem `/api/v1/avatars/...` mostra `(memory cache)` ou `(disk cache)`.
3. **Troca na hora (US2, SC-002)**: no `/perfil`, trocar a foto. Ao aparecer "Foto atualizada.", a
   nova está no resumo e no cabeçalho, sem recarregar; o `src` mudou e não tem `?t=` nem outra query.
   Navegar para `/grupos` e voltar: continua a nova.
4. **Iniciais (US3, SC-003)**: em DevTools → Network, bloquear o padrão `*/api/v1/avatars/*` e
   recarregar. Resumo e cabeçalho mostram as iniciais, sem ícone de imagem quebrada.
5. **Sem texto de link temporário (SC-004)**:

   ```bash
   git grep -n -i -E "assinad|expir" -- components/app/avatar.tsx components/app/avatar-photo.tsx lib/api/kotta.ts
   ```

   Esperado: nenhuma linha sobre a foto de perfil.
