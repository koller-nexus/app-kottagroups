# Quickstart: validar convites por link e e-mail

## Pré-requisitos

- API com a spec 071 rodando (local ou staging) e `API_ORIGIN` apontando para ela.
- Duas contas com e-mail confirmado (A = dono de um grupo, B = sem relação com o grupo) e um
  e-mail novo sem conta (C).
- `pnpm install` (traz `uqr`).

## Checagens automáticas

```bash
pnpm test     # inclui lib/invites.test.mjs e lib/api/errors (códigos novos)
pnpm lint
pnpm build
```

Esperado: tudo verde; `lib/invites.test.mjs` cobre formato do token, retorno ao convite,
validação do formulário, separação pendentes/encerrados, estado da página, `qrSvgPath` e
`redactInviteUrl`.

## Roteiro manual (375 px e desktop)

1. **Gerar (US2)** — Como A, abrir o grupo → "Convidar" → "Gerar link". Ver link, "Copiar link"
   (anuncia "Link copiado"), QR e "uso único, vale até …". Fechar com Esc: foco volta ao botão.
2. **Entrar já logado (US1)** — Como B, abrir o link: prévia com emoji, nome do grupo e quem
   convidou → "Entrar no grupo" → página do grupo com "Você entrou em …". Abrir o link de novo:
   "Este convite não vale mais" (uso único).
3. **Entrar sem conta (US1)** — Gerar outro link, abrir em janela anônima: "Criar conta" → cadastro
   com C → confirmar e-mail → volta sozinho para o convite → "Entrar no grupo".
4. **Por e-mail (US3)** — Como A, convidar o e-mail de B. Ver "Convite enviado para …" e o link.
   Abrir o link logado como outra conta: "Este convite foi enviado para outro e-mail" →
   "Sair e entrar com outra conta" → entrar como B → volta ao convite → entra.
5. **Lista e revogar (US4)** — Em Membros, ver Pendentes/Encerrados. Revogar um pendente (confirma)
   → vira "Revogado" e o anúncio é lido. Abrir o link revogado: mensagem de inválido.
6. **Várias pessoas (US5)** — Gerar link para 2 pessoas, 1 dia. Duas contas entram; a terceira vê
   inválido. Preencher e-mail esconde "Várias pessoas".
7. **Membro comum** — Como B (membro), o grupo não mostra "Convidar" nem a seção de convites.
8. **Segredo** — Na página do convite, conferir no HTML `<meta name="robots" content="noindex, nofollow">`
   e `<meta name="referrer" content="no-referrer">`; no painel do Vercel Analytics a rota aparece
   como `/convite/[token]`.
9. **Erros** — Token lixo (`/convite/abc`) mostra inválido sem chamar a API; API fora mostra
   mensagem com "Tentar de novo"; gerar muitas vezes seguidas mostra a mensagem de limite.
