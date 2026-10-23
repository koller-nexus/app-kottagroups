# Quickstart: validar a CSP com nonce (024)

Pré-requisitos: API local (`api-kottagroups`, `deployments/dev`) em `http://localhost:8085`, como
no 023; `pnpm install` feito.

## 1. Regras puras

```bash
pnpm test
```

Esperado: `lib/csp.test.mjs` passa (diretivas, produção sem `unsafe-*` em script/style, `img-src` por
ambiente, nonce de 16 bytes e único).

## 2. Lint e build

```bash
pnpm lint && pnpm build
```

Esperado: o build lista as mesmas rotas que antes, todas `ƒ (Dynamic)`; o
`.next/prerender-manifest.json` continua só com `/_global-error` (R7). Se alguma rota mudar de
modo, registrar em `performance.md`.

## 3. Ponta a ponta (bloqueio)

```bash
API_ORIGIN=http://localhost:8085 pnpm test:e2e
```

Esperado:

- toda a suíte passa sem violação de política (fixture de `e2e/fixtures.ts`);
- `e2e/security-headers.spec.ts`: página com a política de
  [contracts/csp-header.md](contracts/csp-header.md), arquivo estático só com `frame-ancestors`,
  20 nonces distintos, nonce do HTML igual ao do cabeçalho;
- `e2e/csp.spec.ts`: entrar deslogado, convite com token inexistente, 404 e termos sem violação;
  script inline sem nonce e script externo injetados não rodam.

Conferência rápida à mão, com o app de pé (`pnpm build && pnpm start --port 3002`):

```bash
curl -sI http://localhost:3002/termos | grep -i content-security-policy        # uma linha, com script-src e nonce
curl -sI http://localhost:3002/kotta-icon.png | grep -i content-security-policy # frame-ancestors 'none'
```

Use `/termos` (ou uma requisição sem cookie): logado, `/entrar` redireciona e o redirecionamento
só leva a política de frame.

## 4. Preview na Vercel (US3, SC-007)

1. Em Project Settings → Environment Variables, criar `CSP_REPORT_ONLY=1` só para **Preview**.
2. Abrir o deploy de preview do PR. Conferir:
   ```bash
   curl -sI https://<preview>/termos | grep -i content-security-policy
   ```
   Esperado: `content-security-policy: frame-ancestors 'none'` **e**
   `content-security-policy-report-only: …script-src…`.
3. Com o DevTools aberto (Console), percorrer entrar, painel, grupos, nota com foto, leitura de QR,
   convite, perfil (trocar foto até a prévia aparecer) e uma URL inexistente. Esperado: nenhuma
   mensagem `[Report Only] Refused to …`. Na aba Network, `/_vercel/insights/script.js` e
   `/_vercel/speed-insights/script.js` carregam e os envios para `/_vercel/…` saem com 2xx.
4. Corrigir o que aparecer, remover a variável do Preview e fazer redeploy do preview. Conferir:
   ```bash
   curl -sI https://<preview>/termos | grep -ci '^content-security-policy:'   # 1
   curl -sI https://<preview>/termos | grep -i '^content-security-policy:'    # contém script-src
   ```
   Se vierem duas linhas, ou a única não tiver `script-src`, aplicar a correção de R8 (regra da CSP
   do `next.config.ts` só nos caminhos fora do proxy) antes do merge.
5. Repetir o passo 3 com o bloqueio ligado: sem `Refused to …` no console.
6. Registrar no PR a data e o link do preview em relato e em bloqueio.

## 5. Erro no layout raiz (manual)

Num branch local, fazer `app/layout.tsx` lançar um erro, `pnpm build && pnpm start`, abrir `/` e
conferir que a tela "Algo deu errado" aparece e que o botão de tentar de novo responde (scripts com
nonce). Desfazer a mudança. Se os scripts vierem bloqueados, registrar em `performance.md` como
risco aceito (a página só aparece quando o layout raiz quebra) ou abrir issue.

## 6. Custo (US4, SC-006)

Mesmo método de [018/baseline.md](../018-front-performance/baseline.md): build de produção local,
API local, Chromium mobile 412×823 com CPU 4× mais lenta, coluna "HTML completo" (`responseEnd`).
Em `main` e neste branch, 10 visitas a `/entrar` (deslogado), `/`, `/grupos` e `/perfil` (usuário
de 1 grupo). Registrar o p75 de cada rota em `specs/024-csp-nonce/performance.md`, com a lista de
rotas que mudaram de modo no build (esperado: nenhuma). Piora acima de 20% em alguma rota exige a
decisão (aceitar ou mitigar) escrita ali antes do merge.
