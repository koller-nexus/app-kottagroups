# Quickstart: validar layout web e fluxos de entrar e sair

## Pré-requisitos

- `pnpm install`
- Uma conta de teste com e-mail confirmado e pelo menos 2 grupos, e uma conta sem e-mail confirmado.
- `API_ORIGIN` apontando para a API de desenvolvimento (ou a padrão).

## Portões automáticos

```bash
pnpm lint
pnpm test        # inclui lib/session-flow.test.mjs
pnpm build
pnpm dev         # http://localhost:3002
```

Esperado: os três primeiros passam sem erro.

## Cenários manuais

Use Chrome e Safari. Larguras: 320, 375, 768, 1024, 1440 e 1920 px (DevTools, modo responsivo).

### 1. Sair (história 1; FR-001 a FR-005; SC-001, SC-002)

1. Entre e abra `/grupos/<id>`. A 1440 px, clique "Sair" na barra lateral (1 clique).
   Esperado: botão mostra "Saindo…"; cai em `/entrar` com "Você saiu da conta." e e-mail vazio.
2. Clique voltar no navegador e recarregue. Esperado: `/entrar`; nenhum nome, grupo ou valor aparece.
3. A 375 px: entre, toque em Perfil na barra inferior. Esperado: "Sair" visível sem rolar, logo
   abaixo do resumo; tocar sai (2 toques no total).
4. Logado, abra numa aba nova `http://localhost:3002/sair`. Esperado: volta para `/` ainda logado.
5. Barra lateral com muitos grupos (ou altura da janela 600 px): "Sair" continua visível; a lista de
   grupos rola.

### 2. Entrar e voltar (história 2; FR-007 a FR-011; SC-003, SC-007)

1. Sem sessão, abra `/grupos/<id>?aba=saldos`. Esperado: `/entrar`; após entrar, volta para
   `/grupos/<id>?aba=saldos`.
2. Logado em `/notas`, troque o valor do cookie `kotta_session` por `x` (DevTools → Application) e
   recarregue. Esperado: `/entrar` com "Sua sessão expirou…"; após entrar, volta para `/notas`.
3. Em `/despesas/nova`, preencha o formulário, invalide o cookie como acima e envie. Esperado: entrar
   com o aviso de sessão expirada; após entrar, `/despesas/nova` vazio com "A sessão expirou e o envio
   não foi salvo. Preencha de novo."
4. Senha errada. Esperado: erro anunciado (leitor de tela: VoiceOver), e-mail mantido, foco no campo
   de senha.
5. Preencha com um gerenciador de senhas e também colando a senha. Esperado: funciona; entra em
   menos de 15 s.
6. Conta sem e-mail confirmado. Esperado: cai em "Confirme seu e-mail"; "Entrar com outra conta"
   sai e mostra a tela de entrar.
7. Abra `/entrar?next=https://exemplo.com` e `/entrar?next=//exemplo.com`. Esperado: após entrar, `/`.
8. Logado, abra `/entrar`, `/cadastrar` e `/esqueci-a-senha`. Esperado: `/`.

### 3. Layout web (história 3; FR-012 a FR-021; SC-004 a SC-006, SC-009)

1. A 1440×900, abra o Painel. Esperado: duas colunas (saldo + gastos | quitações + grupos); saldo e
   o primeiro grupo visíveis sem rolar.
2. A 375 px, Painel em uma coluna na ordem: frase, saldo, gastos, quitações, grupos.
3. A 1440 px, navegue Painel → Grupos → Notas → Notificações → Perfil. Esperado: borda esquerda do
   título não se move (meça com a régua do DevTools).
4. Abra `/despesas/nova`, `/grupos/novo` e `/perfil/categorias/nova`. Esperado: conteúdo até 720 px,
   alinhado à esquerda com o título.
5. Em todas as larguras listadas e com zoom de 200%: nenhuma página tem barra de rolagem
   horizontal (`document.documentElement.scrollWidth <= innerWidth` no console).
6. A 375 px, role até o fim de `/grupos/<id>` e `/perfil`. Esperado: o último item fica inteiro acima
   da barra inferior.
7. Margens laterais: 16 px a 375 px, 32 px a 768 px, 40 px a 1440 px.
8. `grep -rn "max-w-" app/\(conta\)` não encontra wrapper de página com largura própria.

### 4. Telas de acesso (história 4; FR-022, FR-023; SC-008)

1. Abra `/entrar`, `/cadastrar`, `/esqueci-a-senha`, `/confirme-seu-email` (conta não confirmada),
   `/confirm-email?token=x` e `/forget-password?token=x`. Esperado: mesma moldura, ícone + "Kotta
   Groups" com link para `/`, mesma largura, sem sombra.
2. Sem login, abra `/` a 1440 px. Esperado: margens das páginas web, Painel de exemplo em duas
   colunas, selos "Baixar na / App Store" e "Disponível no / Google Play" lado a lado, mesma altura,
   sem navegar para as lojas.
