# Kotta Groups

Versão web visual do Kotta Groups — divisão de gastos em grupo, com o mesmo layout da home pública do aplicativo. Sem login. Os selos da App Store e da Google Play aparecem como **Em breve**.

O sistema visual está em [`DESIGN.md`](./DESIGN.md) (o mesmo do app Kotta): verde `#1a5c38`, fundo `#f7f9f8`, Playfair Display, DM Sans e DM Mono.

## Como rodar

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000). A coluna central reproduz a home do app (marca, saldos, gastos do mês, quitações e grupos de demonstração).

## Scripts

```bash
pnpm lint
pnpm test
pnpm build
```

Validação visual: `specs/001-kotta-web-visual/quickstart.md`.
