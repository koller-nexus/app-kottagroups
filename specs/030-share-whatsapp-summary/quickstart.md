# Quickstart: validar "Cobrar" e "Compartilhar resumo"

## Pré-requisitos

- Repo instalado (`pnpm install`), API local no ar (ver `.env`/`README` do projeto).
- Um usuário logado que seja membro de um grupo com pelo menos um acerto pendente onde ele é a
  credora (`settlement.to === me.id`), e outro grupo onde "Todos estão quites".
- Opcional, para o caso de chave Pix: cadastrar uma chave em `/perfil` antes do teste.

## Testes automatizados (lógica)

```sh
pnpm test
```

Deve incluir e passar `lib/share-text.test.mjs` (ver cobertura exigida em
`contracts/share-text.md`).

## Validação manual — "Cobrar" (US1)

1. Abrir um grupo com um acerto pendente em que você é a credora.
2. Na seção "Para acertar", localizar o botão "Cobrar" ao lado do acerto correspondente.
   - **Esperado**: acertos em que você é a *devedora* não mostram esse botão (FR-001, cenário 4).
3. Tocar em "Cobrar".
   - Em navegador/SO com Web Share (ex. Chrome Android, Safari iOS): abre a folha nativa de
     compartilhamento com o texto (nome do grupo, devedor, valor, sua chave Pix se cadastrada,
     link do grupo).
   - Em desktop/navegador sem Web Share: não aparece o botão "Compartilhar" nativo, mas o link
     "Abrir no WhatsApp" e o botão "Copiar texto" MUST estar visíveis e funcionando.
4. Repetir sem chave Pix cadastrada: o texto não deve ter nenhuma linha de Pix.

## Validação manual — "Compartilhar resumo" (US2)

1. Abrir um grupo com dois ou mais acertos pendentes entre pessoas diferentes.
2. Tocar em "Compartilhar resumo".
   - **Esperado**: o texto lista cada par devedor/credora com o valor; a chave Pix aparece só nos
     acertos em que você é a credora (o app não conhece a chave de outros membros).
3. Abrir um grupo "Todos estão quites" e tocar em "Compartilhar resumo".
   - **Esperado**: o texto informa que o grupo está quite, sem listar acertos.

## Checagens de qualidade (toda a feature)

- 375px (DevTools mobile) e desktop (≥1024px): botões não quebram layout, seguem `DESIGN.md`.
- Navegação por teclado: foco visível em "Cobrar"/"Compartilhar resumo", link do WhatsApp e botão
  "Copiar texto"; `aria-label` descritivo em cada um.
- Leitor de tela / inspeção de DOM: feedback de cópia (sucesso ou falha) sai em elemento
  `aria-live="polite"` (reaproveitado de `CopyTextButton`).
- `pnpm lint` e `pnpm test` passam; `pnpm build` passa (mudança visível em runtime).
