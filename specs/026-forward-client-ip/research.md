# Research: Repassar o IP do navegador à API

## R1. De onde ler o IP do navegador

- **Decision**: `x-real-ip` da requisição recebida; se ausente, o primeiro item de
  `x-forwarded-for`. Valor só segue se `isIP()` de `node:net` devolver 4 ou 6.
- **Rationale**: na Vercel, a borda sobrescreve os dois com o IP da conexão (não aceita valor vindo
  do cliente). `ipAddress()` de `@vercel/functions` (sugerido em
  `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-15.md`) só lê `x-real-ip`; ler o
  cabeçalho direto evita a dependência. Fora da Vercel (`next start` local e e2e), `x-real-ip` não
  existe e o servidor do Next preenche `x-forwarded-for` com `socket.remoteAddress` quando ausente
  (`node_modules/next/dist/server/base-server.js:567`, `??=`), o que dá aos e2e um IP real (`::1`
  ou `127.0.0.1`).
- **Alternatives considered**: `request.ip` (removido no Next 15); `@vercel/functions` (dependência
  nova para uma linha; Princípio I); cortar porta e zona de IPv6 (a Vercel não as manda; valor fora
  do formato só é descartado).

## R2. Onde injetar os cabeçalhos

- **Decision**: em `apiRequest` (`lib/api/server.ts`), depois dos cabeçalhos do chamador, com
  `headers.set` (sobrescreve). E em `checkToken` de `app/sair/route.ts`, que faz `fetch` direto.
- **Rationale**: todas as chamadas servidor→API passam por esses dois pontos (o grep de
  `apiOrigin()` mostra só eles e o rewrite). `apiRequest` já roda sempre dentro de uma requisição:
  as chamadas com `auth: true` leem `cookies()`, e as com `auth: false` estão em Server Actions
  (`app/actions/auth.ts`) ou na prévia de convite (`lib/api/kotta.ts:150`), também em requisição.
  Assim `headers()` de `next/headers` está sempre disponível. Os cabeçalhos da chamada nascem de
  `rest.headers` do chamador, nunca da requisição do navegador; com `set` por último, nem um
  chamador consegue mandar outro valor.
- **Alternatives considered**: repetir em cada Server Action ao lado do `browserHeaders()` (deixa
  as páginas e o status das notas de fora, que é onde está a amplificação); `proxy.ts` gravar um
  cabeçalho interno (o proxy não chama a API; mais uma camada para o mesmo dado).

## R3. Nomes e segredo (contrato com api#250)

- **Decision**: `X-Kotta-Client-IP` (sugerido em api#250) e `X-Kotta-Bff-Secret` com valor fixo da
  variável `KOTTA_BFF_SECRET`. Nomes concentrados em constantes de `lib/api/client-ip.ts`.
- **Rationale**: a issue da API propõe "segredo compartilhado (ou mTLS / HMAC)"; o segredo fixo é o
  mais simples que fecha o problema, porque a chamada vai do servidor à API por HTTPS e o segredo
  nunca passa pelo navegador. Se o contrato fechar em HMAC ou outro nome, muda só
  `client-ip.ts` (Assumptions da spec).
- **Alternatives considered**: HMAC de IP + timestamp (protege contra replay de um segredo vazado,
  mas o segredo não sai do servidor; complexidade sem ameaça concreta hoje); mTLS (não suportado em
  `fetch` de função da Vercel sem configuração de agente).

## R4. Segredo fora do navegador

- **Decision**: variável sem prefixo `NEXT_PUBLIC_`, lida só em `lib/api/server.ts` (que já importa
  `server-only`). `client-ip.ts` é puro: recebe o segredo por parâmetro e não lê ambiente.
- **Rationale**: o Next só embute no bundle do cliente variáveis `NEXT_PUBLIC_`; `server-only`
  quebra o build se um componente cliente importar `server.ts` (Princípio IV). Manter
  `client-ip.ts` puro deixa o teste unitário importar o módulo sem `server-only`, como
  `errors.test.mjs` faz com `errors.ts`.
- **Alternatives considered**: `client-ip.ts` ler `process.env` e importar `server-only` (o teste
  com `node --test` não consegue importar `server-only`).

## R5. Segredo ausente

- **Decision**: sem `KOTTA_BFF_SECRET`, nenhum dos dois cabeçalhos vai. Com `VERCEL_ENV ===
  "production"` e sem segredo, um `console.warn` uma vez por instância (flag de módulo).
- **Rationale**: front e API podem ir para produção em qualquer ordem (US3). A flag de módulo é
  estado do processo, não da requisição, então não cai na regra
  `server-no-shared-module-state`.
- **Alternatives considered**: falhar o build sem segredo (quebra Preview e dev local); avisar em
  toda chamada (inunda o log).

## R6. Verificação ponta a ponta

- **Decision**: a Playwright sobe o Next com `KOTTA_BFF_SECRET=e2e-bff-secret`. O
  `e2e/mock-api-proxy.ts` guarda os cabeçalhos `x-kotta-*` das últimas chamadas e os expõe em
  `GET /__mock/last-headers` (zera com `DELETE`). Um spec novo confere: cabeçalhos presentes, IP
  válido, valores forjados pelo navegador (`extraHTTPHeaders`) não chegam, e o segredo não aparece no
  HTML nem nos scripts da página.
- **Rationale**: o Next chama a API pelo servidor, então `page.route` não vê essas chamadas; o proxy
  de mock já é o ponto de observação (comentário no topo do arquivo).
- **Limite conhecido**: localmente o `x-forwarded-for` vindo do navegador é aceito pelo Next
  (`??=`). O e2e não testa forjar esse cabeçalho; a proteção vem da borda da Vercel (R1).

## R7. Status em lote

- **Decision**: fora do escopo (spec, Assumptions). Nada muda em `app/api/notas/status/route.ts`;
  as 20 chamadas passam a levar o IP pelo `apiRequest`.
