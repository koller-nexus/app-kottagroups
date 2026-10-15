# Quickstart: validar páginas de erro e logout automático

Pré-requisitos: `pnpm install`; API local ou de homologação em `API_ORIGIN`; uma conta de teste.
Contratos em [contracts/](./contracts/), regras em [data-model.md](./data-model.md).

## 1. Testes automatizados

```bash
pnpm lint && pnpm test
```

Esperado: passam `lib/session-expiry.test.mjs`, `lib/error-state.test.mjs`,
`lib/session-flow.test.mjs` (com `logoutDestination`) e os demais.

```bash
API_ORIGIN=http://localhost:8085 E2E_EMAIL=… E2E_PASSWORD=… pnpm test:e2e e2e/errors.spec.ts e2e/access.spec.ts
```

Esperado: 404 pública e no app, cookie vencido → `/entrar?motivo=expirada`, sair numa aba desloga a
outra, e `access.spec.ts` continua verde (`/grupos` sem sessão → `/entrar?...next=%2Fgrupos`).

## 2. Páginas 404 (US2)

```bash
pnpm dev
```

1. Deslogado, abrir `http://localhost:3000/qualquer-coisa`: cartão com logo, "Página não
   encontrada", "Ir para o início" e "Voltar"; título da aba "Página não encontrada — Kotta Groups";
   `<meta name="robots" content="noindex">` no HTML (o Next injeta em toda página não encontrada).
2. Logado, abrir `/grupos/00000000-0000-0000-0000-000000000000`: cabeçalho + barra de abas, "Esse
   item não existe ou você não tem acesso a ele.", "Ir para o Painel" e "Voltar".
3. Logado, abrir um grupo de outra conta: mesma tela do passo 2.

## 3. Credencial vencida com cookie presente (US1, cenário 1)

Gerar um JWT com `exp` no passado (assinatura não importa para o proxy):

```bash
node -e 'const b=s=>Buffer.from(JSON.stringify(s)).toString("base64url");console.log(`${b({alg:"HS256"})}.${b({exp:Math.floor(Date.now()/1000)-60})}.x`)'
```

No DevTools → Application → Cookies, trocar o valor de `kotta_session` pelo token acima e abrir
`/grupos`. Esperado: `/entrar?motivo=expirada&next=%2Fgrupos`, aviso "Sua sessão expirou", cookie
removido. Abrir `/entrar` com o mesmo cookie vencido: a página abre (não volta para `/`).

## 4. Aba aberta parada (US1, cenários 2–4)

Em desenvolvimento, para não esperar 24 h, iniciar o app com uma folga artificial não é suportado;
usar a API local configurada com TTL curto (por exemplo 3 min) ou validar os prazos pelo teste de
`watcherDeadlines`. Com TTL curto:

1. Entrar e ficar em `/grupos` sem tocar em nada. A 2 min do fim aparece "Sua sessão vai expirar em
   2 minutos. Salve o que estiver fazendo." No fim, a aba vai sozinha para
   `/entrar?motivo=expirada&next=%2Fgrupos`.
2. Entrar de novo: volta para `/grupos`.
3. No celular (ou simulando `document.hidden`): mandar o app para segundo plano antes do fim e voltar
   depois. Esperado: desloga ao voltar, sem toque.

## 5. Serviço fora do ar (US3)

1. Logado, derrubar a API (ou apontar `API_ORIGIN` para uma porta fechada) e abrir
   `/sair?motivo=expirada&next=%2Fgrupos`. Esperado: volta para `/grupos`, que mostra "O Kotta Groups
   está fora do ar" com "Tentar de novo"; sem passar por `/entrar`; cookie mantido.
2. Subir a API e tocar "Tentar de novo": `/grupos` abre logado.
3. Com a API fora, tocar "Sair da conta": vai para `/entrar?motivo=saiu` (comportamento atual).

## 6. Duas abas (US4)

Abrir `/grupos` e `/perfil` em duas abas logadas. Tocar "Sair" na primeira. Esperado: a segunda vai
para `/entrar?motivo=saiu` em até 2 s. Repetir o passo 3 (cookie vencido) numa aba: a outra, ao
receber a mensagem, vai para `/entrar?motivo=expirada&next=%2Fperfil`.

## 7. Erro inesperado e raiz (US5)

1. Provocar um `throw` temporário numa página da área logada: tela "Algo deu errado", "Tentar de
   novo", "Ir para o Painel", "Código: <hash>"; no console `[app] erro na tela` com `digest`.
2. Provocar um `throw` em `app/layout.tsx`: `app/global-error.tsx` renderiza a mesma tela com
   "Ir para o início" e estilos do app.
3. Com a API devolvendo 503: variante "fora do ar" com a mensagem de `friendlyMessage`.

## 8. Página `/sessao-expirada` (US6)

Abrir `/sessao-expirada?motivo=envio&next=%2Fdespesas%2Fnova%3Faviso%3Denvio-nao-salvo` logado e
deslogado: abre nos dois casos; "Entrar de novo" leva a
`/entrar?motivo=envio&next=%2Fdespesas%2Fnova%3Faviso%3Denvio-nao-salvo`.

## 9. Layout e acessibilidade

Em 375px e desktop: cada tela com um único `h1`, ações com foco visível pelo teclado (Tab), sem
rolagem horizontal, aviso do watcher anunciado (`role="status"`).

## 10. Build

```bash
pnpm build
```
