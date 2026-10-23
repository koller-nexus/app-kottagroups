# Quickstart: validar o repasse do IP

Contrato: [contracts/bff-client-ip.md](./contracts/bff-client-ip.md).

## Pré-requisitos

- API local rodando (`API_ORIGIN`, ex.: `http://localhost:8085`), como na suíte e2e de hoje.
- `pnpm install`.

## 1. Unitário

```bash
pnpm test
```

Esperado: `lib/api/client-ip.test.mjs` passa (IP válido v4/v6, inválido, ausente, segredo ausente,
`x-real-ip` antes de `x-forwarded-for`).

## 2. Ponta a ponta

```bash
API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/client-ip.spec.ts
```

Esperado:

- Página logada e login: `GET /__mock/last-headers` mostra `clientIp` válido e
  `secret = "e2e-bff-secret"` em todas as chamadas.
- Com `X-Kotta-Client-IP: 203.0.113.9` e `X-Kotta-Bff-Secret: forged` enviados pelo navegador, a API
  não recebe esses valores.
- `e2e-bff-secret` não aparece no HTML nem nos scripts carregados.

Suíte inteira (SC-005): `API_ORIGIN=http://localhost:8085 pnpm test:e2e`.

## 3. Sem segredo (US3)

```bash
pnpm build && API_ORIGIN=http://localhost:8085 pnpm start --port 3002
```

Sem `KOTTA_BFF_SECRET`: o app funciona como hoje e nenhuma chamada leva `X-Kotta-*`.

## 4. Produção (depois do deploy, com api#250 publicada)

- Vercel → Settings → Environment Variables: `KOTTA_BFF_SECRET` em Production e Preview, com o
  mesmo valor configurado na API de cada ambiente.
- Logs da API (Loki): chamadas do front registram IPs de navegador variados, não o IP de saída da
  Vercel.
- Logs da Vercel: nenhum aviso "client IP not forwarded".
