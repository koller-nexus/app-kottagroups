# Research: CSP completa com nonce (024)

Fontes: guia instalado `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`
(Next 16.4.2), código do Next em `node_modules/next/dist/server/`, pacotes `@vercel/analytics`
2.0.1 e `@vercel/speed-insights` 2.0.0, e o repositório `api-kottagroups` (origem das imagens).

## R1. Onde gerar o nonce e montar a política

- **Decision**: no `proxy.ts` existente, a cada requisição que ele já intercepta. A montagem da
  política fica numa função pura em `lib/csp.ts` (`contentSecurityPolicy`), e o nonce em
  `createNonce()` no mesmo arquivo.
- **Rationale**: é o caminho do guia do Next. O Next lê o nonce do cabeçalho da **requisição**
  (`parse-request-headers.js`: `content-security-policy || content-security-policy-report-only`) e o
  aplica sozinho nos scripts do framework, nos chunks da página e nos estilos e scripts inline que
  ele gera. O proxy já reescreve os cabeçalhos da requisição (`PATH_HEADER`), então é uma linha a
  mais no mesmo `NextResponse.next({ request: { headers } })`. A função pura dá teste em
  `pnpm test` sem subir o app.
- **Alternatives considered**: SRI experimental (`experimental.sri`), que mantém páginas estáticas
  (rejeitado: experimental, e nenhuma página do app é estática hoje, ver R7); política fixa com
  `'unsafe-inline'` em `next.config.ts` (rejeitado: não bloqueia script inline injetado, que é o
  objetivo da issue).

## R2. Nonce

- **Decision**: 16 bytes de `crypto.getRandomValues`, em base64 (`btoa`). Gerado uma vez por
  requisição, só em memória; vai no cabeçalho da requisição e da resposta, e o Next o põe nas tags
  `<script>`.
- **Rationale**: 128 bits, como pede o FR-003. O exemplo do guia usa `crypto.randomUUID()`, que tem
  só 122 bits aleatórios. Base64 casa com o padrão que o Next aceita
  (`/^'nonce-([A-Za-z0-9+/_-]+={0,2})'$/`). `crypto` e `btoa` existem no Node e no Bun (os scripts
  `start` e `build` rodam com `bun --bun`). As páginas já são dinâmicas e sem cache compartilhado
  (R7), então o nonce não é reaproveitado.
- **Alternatives considered**: `Buffer.from(...).toString("base64")` (funciona, mas `btoa` é da
  plataforma e serve aos dois runtimes sem import).

## R3. Diretivas

- **Decision** (produção):

  | Diretiva | Valor | Por quê |
  |----------|-------|---------|
  | `default-src` | `'self'` | base para o que não tiver diretiva própria |
  | `script-src` | `'self' 'nonce-…' 'strict-dynamic'` | FR-002. `'strict-dynamic'` deixa rodar o que um script com nonce cria (chunks do Next, scripts da Vercel); `'self'` só vale para navegador sem CSP3 |
  | `style-src` | `'self' 'nonce-…'` | folhas do app e `<style>` inline do Next (recebe o nonce) |
  | `style-src-attr` | `'unsafe-inline'` | atributos `style=` (R5) |
  | `img-src` | `'self' blob: <origem da API>` | R4 |
  | `font-src` | `'self'` | DM Mono auto-hospedada por `next/font` |
  | `connect-src` | `'self'` | `/api/v1` (rewrite), `/api/notas/status`, Server Actions, envios da Vercel |
  | `object-src` | `'none'` | FR-001 |
  | `base-uri` | `'self'` | FR-001 |
  | `form-action` | `'self'` | FR-001 |
  | `frame-ancestors` | `'none'` | FR-008, mantém o 023 |

- **Desenvolvimento** (`NODE_ENV=development`): `'unsafe-eval'` em `script-src` (o React usa
  `eval` para reconstruir pilhas de erro) e `'unsafe-inline'` em `style-src` (overlay de erro), como
  no guia. Nada disso em produção (FR-011); o teste unitário confere.
- **Sem `upgrade-insecure-requests`**: o e2e roda em `http://localhost` e carrega imagens de
  `http://localhost`; a diretiva os trocaria por `https`. Em produção não muda nada: o HSTS já força
  HTTPS no app e `httpsUrl()` (spec 023) só aceita imagem `https:` fora do loopback.
- **Sem `data:`**: nenhum uso no app (busca por `data:` em `app/`, `components/`, `lib/` e CSS só
  achou o teste de `httpsUrl`). `next/image` não usa placeholder `blur`. Se o e2e (R8) acusar uma
  violação de `data:`, ela entra com a justificativa.
- **Sem `worker-src`, `frame-src`, `media-src` próprios**: não há worker, iframe nem mídia; caem no
  `default-src 'self'`. A leitura de QR usa `jsqr` na thread principal e o `BarcodeDetector` nativo,
  sem WebAssembly.
- **Sem endpoint de relatório** (`report-to`): premissa da spec.

## R4. Origens de imagem

- **Decision**: `img-src 'self' blob: <apiOrigin>`; quando `apiOrigin` é loopback (dev e e2e),
  também `http://localhost:*` e `http://127.0.0.1:*`.
- **Rationale**: na API, avatares (`/api/v1/avatars/...`) e fotos de nota (URL assinada de
  `storage.SignedInvoiceURL`) usam a mesma base, `APP_PUBLIC_URL`, que em produção é
  `https://api.kottagroups.com.br` (atrás da Cloudflare), igual ao `API_ORIGIN` do app. `blob:` é a
  prévia de `components/forms/avatar-form.tsx` (`URL.createObjectURL`). Ícones e logos são do
  próprio app. No e2e, o app fala com o proxy simulado (`localhost:3003`), mas os avatares vêm da
  API real (`localhost:8085`) e os arquivos simulados de `localhost:3003`: portas diferentes, por
  isso o curinga de porta só no loopback. É a mesma regra de `httpsUrl()`.
- **Alternatives considered**: variável de ambiente só para a origem de imagens (rejeitado:
  em produção é a mesma origem da API; seria configuração para um valor que não muda);
  `https:` inteiro (rejeitado: deixaria qualquer domínio servir imagem, contra o FR-005).

## R5. Atributos `style=` inline

- **Decision**: manter, com `style-src-attr 'unsafe-inline'`. Blocos `<style>` continuam exigindo
  nonce.
- **Rationale**: 5 componentes usam `style={{…}}` com valores calculados (largura de barra,
  cor do avatar, posição); `next/image` também emite `style="color:transparent"`. Trocar tudo por
  classes não cabe numa entrega de segurança. Risco residual: um XSS que injete HTML pode mudar a
  aparência de elementos com `style=`, mas não executa script nem carrega CSS de fora (atributo
  `style` não faz `@import`, e `url()` em atributo cai em `img-src`). `style-src-attr` existe em
  Chrome/Edge 75+, Firefox 108+ e Safari 15.4+; navegador mais antigo cai no `style-src` com nonce e
  os atributos `style=` não se aplicam (aparência pior, nada quebra de função).
- **Alternatives considered**: `'unsafe-inline'` no `style-src` (rejeitado: com nonce presente o
  navegador ignora `'unsafe-inline'`, e sem nonce libera `<style>` injetado); remover os `style=`
  (rejeitado agora; candidato a outra issue).

## R6. Scripts da Vercel

- **Decision**: nenhuma origem extra.
- **Rationale**: `@vercel/analytics/next` e `@vercel/speed-insights/next` criam o `<script>` com
  `document.createElement` dentro do bundle do app, que roda com nonce; `'strict-dynamic'` libera
  esse script. Em produção ele vem de `/_vercel/insights/script.js` e
  `/_vercel/speed-insights/script.js`, e os envios vão para `/_vercel/...` no mesmo domínio
  (`connect-src 'self'`). Em dev vem de `https://va.vercel-scripts.com`, também liberado pelo
  `'strict-dynamic'`. Fora da Vercel (e2e local) o script dá 404, o que não é violação de política.
- **Alternatives considered**: listar `va.vercel-scripts.com` em `script-src` (rejeitado: com
  `'strict-dynamic'` a lista de hosts é ignorada pelos navegadores com CSP3).

## R7. Renderização dinâmica e custo (US4, FR-013)

- **Decision**: chamar `await connection()` no `app/layout.tsx`. Nenhuma página muda de modo.
- **Rationale**: o build de `main` em `4b7878b` (2026-10-23) marca as 29 rotas como `ƒ (Dynamic)`;
  o `prerender-manifest.json` só tem `/_global-error`. Logo, nenhuma página deixa de ser
  pré-gerada e o custo esperado é só o do proxy (16 bytes aleatórios e uma string por requisição).
  Sem nonce, uma página que um dia virasse estática teria todos os scripts bloqueados em produção,
  em silêncio; `connection()` no layout raiz deixa a dependência explícita e impede isso.
  `/_global-error` continua pré-gerada (é componente cliente e não pode chamar `connection()`); ela
  só aparece quando o layout raiz falha, e o Next a renderiza na mesma requisição. Fica uma
  checagem manual no [quickstart](quickstart.md) §5.
- **Medição**: mesmo método da spec 018 (build de produção local, Chromium mobile, coluna "HTML
  completo" = `responseEnd`), em `/entrar`, `/`, `/grupos` e `/perfil`, 10 visitas cada, p75, antes
  e depois. Resultado vai em `specs/024-csp-nonce/performance.md`. Limite do SC-006: +20%.
- **Alternatives considered**: não chamar `connection()` (rejeitado pelo risco silencioso acima;
  custo zero porque tudo já é dinâmico).

## R8. Uma política por resposta e convivência com `next.config.ts` (FR-008, FR-009)

- **Decision**: `next.config.ts` continua mandando `Content-Security-Policy: frame-ancestors 'none'`
  e os outros 4 cabeçalhos em `/:path*`. O proxy manda a política completa só nas respostas que ele
  intercepta:
  - **bloqueio** (padrão): `Content-Security-Policy: <completa>` na resposta e na requisição. No
    servidor do Next, cabeçalhos do proxy sobrescrevem os de `headers()` com a mesma chave
    (`resolve-routes.js`: `headers()` grava `resHeaders[key]` antes, o proxy grava depois). A página
    sai com uma política só.
  - **só relatar** (`CSP_REPORT_ONLY=1`): `Content-Security-Policy-Report-Only: <completa>` na
    resposta e na requisição; a `Content-Security-Policy: frame-ancestors 'none'` do config continua
    valendo, então o frame segue bloqueado durante a observação.
  - Arquivos estáticos, `/api/*` e redirecionamentos do config não passam pelo proxy e ficam com a
    política só de frame, como hoje.
- **Por que o proxy não manda a política de frame no modo relatar**: o Next copia os cabeçalhos da
  resposta do proxy para a requisição e lê `content-security-policy` **antes** do
  `-report-only`. Uma `Content-Security-Policy` só de frame vinda do proxy esconderia o nonce, e
  todos os scripts ficariam sem ele.
- **Risco a verificar na Vercel**: lá os cabeçalhos de `next.config.ts` viram regras de roteamento
  da plataforma; não está no código local qual lado vence quando a chave é a mesma. O quickstart §4
  confere no preview que a página tem **uma** `content-security-policy` com `script-src`. Se a da
  config vencer (página só com frame) ou vierem duas, a correção é trocar a fonte da regra do
  config de `/:path*` para os caminhos fora do matcher do proxy (`/_next/:path*`, `/api/:path*` e
  arquivos `.png`, `.svg`, `.ico`).
- **Alternatives considered**: tirar a CSP do config já agora (rejeitado: redirecionamentos do
  config e arquivos estáticos perderiam o `frame-ancestors`, e a regra por caminho espelha o matcher
  do proxy em dois lugares sem necessidade comprovada).

## R9. Troca de modo (FR-010, US3)

- **Decision**: variável de ambiente `CSP_REPORT_ONLY`; `"1"` envia como relato, qualquer outro
  valor (ou ausente) aplica o bloqueio. A política é a mesma nos dois modos; muda só o nome do
  cabeçalho.
- **Rationale**: o modo muda por ambiente (Preview em relato durante a observação, Production em
  bloqueio) e serve de volta rápida sem mudar código. Padrão em bloqueio para que o e2e e a produção
  já nasçam protegidos; esquecer a variável não desliga a proteção.
- **Alternatives considered**: constante no código trocada por um segundo PR (rejeitado: o e2e do
  primeiro PR não testaria o bloqueio, e voltar ao relato exigiria outro PR).

## R10. Testes (FR-014, FR-015)

- **Decision**:
  - `lib/csp.test.mjs` (`pnpm test`): diretivas do FR-001 presentes; produção sem
    `'unsafe-eval'` nem `'unsafe-inline'` em `script-src`/`style-src`; dev com eles; `img-src` com
    só a origem da API em produção e com o curinga de loopback no local; nonce com 16 bytes e
    diferente a cada chamada.
  - `e2e/security-headers.spec.ts`: `/entrar` com a política completa (diretivas, nonce no
    `script-src`), `/kotta-icon.png` com só `frame-ancestors 'none'`; os outros 4 cabeçalhos iguais
    ao 023; 20 requisições a `/entrar` com 20 nonces distintos; os `<script>` do HTML com o mesmo
    nonce do cabeçalho.
  - `e2e/fixtures.ts`: `test` estendido com um fixture automático que escuta
    `securitypolicyviolation` em todas as páginas (via `exposeBinding` + `addInitScript`, que
    sobrevive a navegações) e falha o teste se houver violação. As 13 specs passam a importar `test`
    dele. Assim toda a suíte (perfil com prévia, foto de nota, leitura de QR, notas, listas,
    despesas) vira teste de "nenhuma violação".
  - `e2e/csp.spec.ts`: telas que a suíte não visita (`/entrar` deslogado, `/convite/<token
    inexistente>`, uma rota inexistente, `/termos`) e o teste de bloqueio: `page.route` injeta no HTML
    de `/entrar` um `<script>` inline sem nonce e um `<script src="https://example.com/x.js">` (este
    também roteado, para não depender de rede); nenhum dos dois roda e as violações são registradas.
- **Rationale**: o evento `securitypolicyviolation` dispara no bloqueio e no relato, então o mesmo
  fixture serve aos dois modos. O Chromium do Playwright não tem extensões que gerem ruído.
- **Alternatives considered**: ler o console procurando "Content Security Policy" (rejeitado: texto
  do navegador, frágil); spec nova navegando todas as telas de novo (rejeitado: duplica setups que
  a suíte já tem).

## R11. Origem da API num lugar só

- **Decision**: mover `apiOrigin()` de `lib/api/server.ts` para `lib/api/origin.ts` (sem
  `server-only`) e usá-la em `lib/api/server.ts`, `proxy.ts` e `next.config.ts`.
- **Rationale**: o proxy é o terceiro uso de `process.env.API_ORIGIN ?? "https://api.kottagroups.com.br"`
  (constituição: extrair no terceiro uso). `lib/api/server.ts` importa `server-only` e
  `next/headers`, que não servem ao `next.config.ts`.
- **Alternatives considered**: copiar a expressão no proxy (rejeitado: três cópias do padrão de
  produção).
