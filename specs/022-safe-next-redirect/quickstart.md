# Quickstart: validar o destino de retorno

## Verificações automáticas

```bash
pnpm lint && pnpm test && pnpm build
```

Esperado: os casos de [contracts/safe-next-path.md](contracts/safe-next-path.md) passam em
`lib/safe-next.test.mjs`, e os testes que já existiam em `lib/session-flow.test.mjs` continuam
passando.

## Verificações manuais

Com o app rodando (`API_ORIGIN=http://localhost:8085 pnpm dev`):

1. **/sair sem sessão (US1)**:

   ```bash
   for n in /%09/evil.example /%0A/evil.example /%0D/evil.example /%09%5Cevil.example /.//evil.example /%2e//evil.example; do
     curl -s -o /dev/null -w "$n -> %{redirect_url}\n" "http://localhost:3000/sair?next=$n"
   done
   ```

   Esperado: todas as linhas terminam em `http://localhost:3000/entrar`, sem `next`. Antes da
   correção, a primeira mostra `/entrar?next=%2F%09%2Fevil.example`.

2. **/sair logado (US1, SC-001)**: no navegador, com sessão, abrir
   `http://localhost:3000/sair?next=/%09/evil.example`. Esperado: página inicial do app.

3. **Depois de entrar (US2)**: sem sessão, abrir `/entrar?next=/%09/evil.example` e entrar com uma
   conta de teste. Esperado: página inicial do app. Repetir em `/cadastrar` e
   `/confirme-seu-email`.

4. **Destino legítimo (US3, SC-002)**: sem sessão, abrir
   `/entrar?next=%2Fgrupos%2F<id>%3Faba%3Dmembros%23topo` e entrar. Esperado:
   `/grupos/<id>?aba=membros#topo`.
