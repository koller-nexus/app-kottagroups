# Contract: IP do navegador nas chamadas servidor → API

Proposta do front para api#250. Nomes finais dependem do contrato da API (ver research R3).

## Cabeçalhos enviados à API

| Cabeçalho | Valor | Quando |
|-----------|-------|--------|
| `X-Kotta-Client-IP` | IPv4 ou IPv6 do navegador (ex.: `203.0.113.7`, `2001:db8::1`) | segredo configurado **e** IP válido |
| `X-Kotta-Bff-Secret` | valor de `KOTTA_BFF_SECRET` | junto com o anterior, nunca sozinho |

- Os dois vão juntos ou nenhum vai.
- Vão em toda chamada de `apiRequest` e em `checkToken` de `/sair`, com ou sem sessão.
- `User-Agent` em entrar/cadastrar segue como hoje.
- O front nunca copia esses cabeçalhos da requisição do navegador.

## O que a API deve fazer (lado api#250, só para referência)

- Usar `X-Kotta-Client-IP` como IP do cliente só se `X-Kotta-Bff-Secret` bater (comparação em tempo
  constante). Sem segredo ou com segredo errado: ignorar o cabeçalho e usar o IP da conexão.

## Variável de ambiente

| Nome | Onde | Escopo |
|------|------|--------|
| `KOTTA_BFF_SECRET` | Vercel: Production e Preview (valores diferentes); e2e: `e2e-bff-secret` | só servidor (sem `NEXT_PUBLIC_`) |

Ausente: nenhum cabeçalho é enviado; em `VERCEL_ENV=production`, um aviso por instância no log.

## Interface interna

`lib/api/client-ip.ts` (puro, sem `server-only`):

- `CLIENT_IP_HEADER = "X-Kotta-Client-IP"`, `BFF_SECRET_HEADER = "X-Kotta-Bff-Secret"`
- `clientIpHeaders(incoming: Headers, secret: string | undefined): Record<string, string>` →
  `{}` ou os dois cabeçalhos.

`lib/api/server.ts`: `bffHeaders(): Promise<Record<string, string>>` lê o segredo, avisa uma vez e
chama `clientIpHeaders(await headers(), secret)`.

## Mock e2e

`e2e/mock-api-proxy.ts`:

- `GET /__mock/last-headers` → `{ items: [{ path, clientIp, secret }] }` (últimas chamadas, ordem de
  chegada).
- `DELETE /__mock/last-headers` → zera a lista.
