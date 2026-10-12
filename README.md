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
```

Validação visual: `specs/001-kotta-web-visual/quickstart.md`.

## Agentes de IA

O projeto usa Claude Code. As instruções ficam em [`AGENTS.md`](./AGENTS.md), importado por [`CLAUDE.md`](./CLAUDE.md). Skills em `.agents/skills/`; comandos do Spec Kit também em `.claude/skills/`.
