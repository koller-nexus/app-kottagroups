# Kotta Groups

Versão web do Kotta Groups — divisão de gastos em grupo, igual ao app mobile.

- **`/`** sem login: a dashboard do app com dados de exemplo (os mesmos de `mobile-kottagroups/src/data/mock.ts`), Cadastrar e Entrar. Os selos da App Store e da Google Play aparecem como **Em breve**.
- **`/`** com login: a mesma dashboard com os dados reais da API. `/painel` só redireciona para `/`.

O sistema visual é o "Jardim" do app (ver [`DESIGN.md`](./DESIGN.md)).

## Como rodar

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3002](http://localhost:3002): a home é a dashboard do app com dados de exemplo.

## Área logada (integrada à api-kottagroups)

Rotas: `/entrar`, `/cadastrar`, `/confirme-seu-email`, `/`, `/grupos`, `/grupos/novo`, `/grupos/[id]`, `/despesas/nova` e `/perfil`.

- As páginas buscam os dados no servidor do Next (`lib/api/kotta.ts`), nunca no navegador.
- O token JWT da API fica no cookie `httpOnly` `kotta_session` (24 h, igual ao token).
- `proxy.ts` manda quem não tem sessão para `/entrar`.
- Token recusado pela API → `/sair` apaga o cookie e volta para `/entrar`.
- E-mail não confirmado → `/confirme-seu-email`.

A API usada vem de `API_ORIGIN` (padrão: `https://api.kottagroups.com.br`). Para rodar contra a API local:

```bash
API_ORIGIN=http://localhost:8085 pnpm dev
```

No seed de desenvolvimento da API, entre com `williamkoller@kottagroups.com.br` / `kotta123`.

## Scripts

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e   # ver "Testes E2E" abaixo
```

Validação visual: `specs/001-kotta-web-visual/quickstart.md`.

## Testes E2E (Playwright)

Os testes em `e2e/` abrem o app no Chromium e rodam contra a `api-kottagroups` local com o seed
de desenvolvimento. Não há mock: as páginas buscam os dados no servidor do Next, então
`page.route()` não intercepta nada.

1. Suba a API com o seed (na pasta `api-kottagroups`). O limite de login sobe para os testes não
   esbarrarem em `429`:

   ```bash
   make docker-up-stores
   export APP_ENV=dev APP_PORT=8085 AUTH_RATE_LIMIT_ATTEMPTS=1000 \
     DATABASE_URL='postgres://kotta:kotta@localhost:5432/kotta?sslmode=disable' \
     REDIS_URL=redis://localhost:6379 JWT_SECRET=compose-local-dev-secret-min-32-chars
   go run ./cmd/api -migrate && make run
   ```

2. Rode a suíte (nesta pasta):

   ```bash
   pnpm exec playwright install chromium   # uma vez
   export API_ORIGIN=http://localhost:8085
   export E2E_EMAIL=williamkoller@kottagroups.com.br E2E_PASSWORD=kotta123
   pnpm test:e2e
   pnpm exec playwright show-report        # relatório HTML
   ```

- A suíte faz `pnpm build` e sobe o próprio servidor na porta 3002. Se o `pnpm dev` já estiver
  nessa porta, use outra: `E2E_PORT=3003 pnpm test:e2e`. Ela nunca reaproveita um servidor que
  já esteja rodando, porque ele pode estar apontando para a API de produção.
- Sem `API_ORIGIN`, a suíte não inicia. Se a API não responde, só o `setup` falha, com
  `API not reachable at …`.
- Cada execução cria grupo, despesa, lista e categoria com um sufixo único, então dá para repetir
  sem limpar o banco.

Na CI (`.github/workflows/e2e.yml`), todo PR sobe Postgres, Redis e a API (`develop`) e roda a
suíte. Se algum teste falha, o relatório, os traces e o log da API ficam no artefato `e2e-report`.
Secrets do repositório (configurar uma vez): `API_REPO_TOKEN` (leitura em
`koller-nexus/api-kottagroups`), `E2E_EMAIL` e `E2E_PASSWORD`.

## Agentes de IA

O projeto usa Claude Code. As instruções ficam em [`AGENTS.md`](./AGENTS.md), importado por [`CLAUDE.md`](./CLAUDE.md). Skills em `.agents/skills/`; comandos do Spec Kit também em `.claude/skills/`.
