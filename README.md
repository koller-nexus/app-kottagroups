# Kotta Groups

Versão web visual do Kotta Groups — divisão de gastos em grupo, com o mesmo layout da home pública do aplicativo. Sem login. Os selos da App Store e da Google Play aparecem como **Em breve**.

O sistema visual está em [`DESIGN.md`](./DESIGN.md) (o mesmo do app Kotta): verde `#1a5c38`, fundo `#f7f9f8`, Playfair Display, DM Sans e DM Mono.

## Como rodar

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000). A coluna central reproduz a home do app (marca, saldos, gastos do mês, quitações e grupos de demonstração).

## Área logada (integrada à api-kottagroups)

Rotas: `/entrar`, `/cadastrar`, `/confirme-seu-email`, `/painel`, `/grupos`, `/grupos/novo`, `/grupos/[id]`, `/despesas/nova` e `/perfil`.

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
