# Quickstart: validar o fluxo de acesso

## Pré-requisitos

- `pnpm install`; `.env.local` com `API_ORIGIN` de uma API de desenvolvimento com envio de e-mail
  (ou acesso ao log do link de confirmação).
- `pnpm dev` (porta 3002). DevTools em 375px para os cenários de celular.

## Checagens automáticas

```bash
pnpm test     # inclui confirm-email, auth-validation, api/errors e session-flow
pnpm lint
pnpm build
```

Esperado: tudo verde. Os testes cobrem a escolha do estado da confirmação (incluindo
`already-confirmed` e `invalid-or-expired`), o mapeamento de códigos e mensagens da API para campos,
e a URL de `/entrar` depois de um cadastro cujo login falhou.

## Cenários manuais

| # | Passos | Esperado |
|---|--------|----------|
| 1 | 375px: criar conta → abrir o link do e-mail no mesmo navegador | "E-mail confirmado" → "Continuar" → Painel, sem banner de confirmação |
| 2 | Abrir o link num navegador sem sessão | "E-mail confirmado" → "Entrar" → login → Painel |
| 3 | Abrir o mesmo link de novo, logado | Tela de sucesso (já confirmado), não "inválido" |
| 4 | `/confirmar-email` sem token; com token adulterado | "Link incompleto" / "Link inválido ou expirado", com "Reenviar link" e "Ir para o início" |
| 5 | `/confirm-email?token=abc` | Vai para `/confirmar-email?token=abc` |
| 6 | Cadastro sem marcar o aceite | Erro junto à caixa; nenhuma requisição ao `/auth/register` (aba Rede) |
| 7 | Cadastro com e-mail ruim, senha de 5, nome vazio, Pix `123` | Erro em cada campo, foco no primeiro, leitor de tela anuncia |
| 8 | Cadastro com Pix de CPF com dígito errado | Erro da API aparece no campo Pix |
| 9 | Simular falha do login após cadastro (API derruba `/auth/login`) | `/entrar?motivo=conta-criada&email=…` com o e-mail preenchido |
| 10 | Conta não confirmada: "Já confirmei" | Aviso "Ainda não recebemos a confirmação…" |
| 11 | Reenviar duas vezes | Botão desabilitado com contagem de 60 s; segundo clique impossível até zerar |
| 12 | Confirmar em outra aba e voltar para "Confirme seu e-mail" | A tela avança sozinha |
| 13 | `/entrar?next=/grupos` com conta não confirmada → entrar → confirmar | Termina em `/grupos` |
| 14 | Muitos logins errados seguidos | Mensagem com o tempo de espera |
| 15 | Deslogado: `/termos`, `/privacidade` | Abrem com índice, data, versão e aviso de rascunho |
| 16 | Rodapé das telas de acesso e Perfil | Links para Termos e Privacidade |
| 17 | `rg -i "app kotta\|no app\|do app" app components` | Só comentários de código |
| 18 | "Corrigir e-mail" em "Confirme seu e-mail" | Sai da conta e abre `/cadastrar` |
