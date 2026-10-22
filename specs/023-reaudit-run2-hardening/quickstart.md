# Quickstart: validar o endurecimento da run-2

## Pré-requisitos

- `pnpm install` feito; API local de teste rodando (ex.: `http://localhost:8085`).
- `.env` do e2e com `API_ORIGIN`, `E2E_EMAIL` e `E2E_PASSWORD`.

## 1. Dependências (US1, SC-001)

```bash
pnpm audit --prod          # esperado: 0 critical, 0 high
grep -E '"(next|eslint-config-next)"' package.json   # ambos 16.3.8
pnpm lint && pnpm test && pnpm build
```

## 2. Regras puras (FR-007, FR-014, FR-015)

```bash
pnpm test   # inclui invites, api/errors e https-url; tabelas em contracts/pure-rules.md
```

## 3. Suíte e2e (US2, US4, SC-002, SC-005, SC-007)

```bash
API_ORIGIN=http://localhost:8085 pnpm test:e2e
```

Esperado:

- "sair revoga a sessão na API": o bearer antigo recebe 401 em `/api/v1/users/me`.
- "sair encerra a sessão" e "sair numa aba desloga a outra" passam com login próprio, e os testes
  seguintes continuam logados.
- "cabeçalhos de segurança": os 5 cabeçalhos de
  [contracts/security-headers.md](contracts/security-headers.md) aparecem nas 3 respostas.

## 4. Conferência manual (US3, US4)

Com `pnpm build && pnpm start`:

1. **Frame bloqueado**: num HTML local com `<iframe src="http://localhost:3000/entrar">`, o
   navegador recusa o frame.
2. **Analytics**: em DevTools → Network, filtrar pelas chamadas de `/_vercel/insights` e
   `/_vercel/speed-insights` (em produção ou preview, já que os scripts não enviam nada em
   `localhost`). Abrir `/entrar?next=%2Fconvite%2FABC`; o `url` do payload não tem `?`.
   Alternativa local: `pnpm test` cobre a função.
3. **Barra de endereço**: abrir `/redefinir-senha?token=<token-válido>`; a barra mostra
   `/redefinir-senha` e o formulário continua. Trocar a senha funciona. Recarregar a página mostra
   "link sem token".
4. **Referer**: o HTML de `/redefinir-senha` e `/confirmar-email` traz
   `<meta name="referrer" content="no-referrer">`.
5. **`?erro=`**: abrir `/grupos/<id>?erro=Sua%20conta%20foi%20bloqueada`; aparece só "Não foi
   possível concluir agora. Tente de novo.". Com `?erro=GROUP_ARCHIVED`, aparece a mensagem desse
   código.
6. **API fora**: parar a API e clicar em "Sair"; a pessoa vai para `/entrar?motivo=saiu` em até
   ~3 s.
