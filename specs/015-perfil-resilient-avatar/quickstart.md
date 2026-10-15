# Quickstart: validar o Perfil resiliente e a foto

## Pré-requisitos

- API local (`api-kottagroups`) rodando, ex.: `http://localhost:8085`, com storage de avatar local.
- `.env.local` com `API_ORIGIN` apontando para ela; usuário de teste com e-mail confirmado.

## 1. Testes rápidos

```bash
pnpm test     # loadErrorKind, avatarFileProblem, formatMemberSince, friendlyMessage, digest do ApiError
pnpm lint
```

## 2. Perfil com seção falhando (US1, FR-020)

```bash
API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/profile.spec.ts
```

Esperado: com `/categories` em 503 (via `PUT /__mock/fail`), `/perfil` mostra nome, e-mail,
"Seus dados" e "Sair da conta"; a seção Categorias mostra o erro e "Tentar de novo". Depois do
`DELETE /__mock/fail`, "Tentar de novo" carrega as categorias.

## 3. Tela de erro geral (US2)

```bash
pnpm build && pnpm start
```

- Pare a API e abra `/perfil` → "O Kotta Groups não respondeu" (prova que o `digest`
  `API_UNAVAILABLE:*` chega ao cliente em build de produção; ver research R3).
- DevTools → offline → navegue para outra tela da área logada → "Você está sem conexão".
- Console do navegador mostra `[app] erro na tela` com `digest`; o log do servidor tem o mesmo digest.

## 4. Dados e foto (US3, US4)

- `/perfil` em 375px e em desktop: foto ou iniciais, nome, e-mail completo em "Seus dados", Chave Pix
  (ou CTA), "Membro desde …", status do e-mail; sem rolagem horizontal.
- "Alterar foto" com JPG ≤ 5 MB → prévia, "Enviando…", "Foto atualizada."; a foto aparece no Perfil e
  na sidebar (desktop) sem recarregar.
- GIF ou JPG > 5 MB → "Use uma foto JPG, PNG ou WebP de até 5 MB", nenhuma linha
  `POST /users/me/avatar` no log da API.
- Troque a URL da foto por uma inválida (ou espere expirar) → iniciais, sem ícone quebrado.
- Usuário com e-mail não confirmado → aviso com link para `/confirme-seu-email`, sem seletor.

## 5. Causa raiz em produção (FR-008, manual)

- Vercel → Logs em 12/10/2026 ~22:16 (BRT): procurar `[api] GET /users/me|/groups|/categories -> …`.
  Sem linha `[api]` → erro de render; anotar o `digest`.
- API (`api-kottagroups`): logs de `/api/v1/categories` no mesmo horário (cache Redis de categorias,
  migrations `global-categories`, `EDGE_BLOCKED`).
- Causa na API → abrir issue em `koller-nexus/api-kottagroups` com a evidência e linkar na #11.
