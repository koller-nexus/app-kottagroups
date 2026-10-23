# Custo da CSP com nonce (024)

Data: 2026-10-23. `main` em `4b7878b` × `feature/024-csp-nonce` (mudanças desta spec).

## Método

O mesmo de [018/baseline.md](../018-front-performance/baseline.md):
- `next build` + `next start` locais com `API_ORIGIN=http://localhost:8085`;
- API local do `api-kottagroups` (`develop`, `deployments/dev`);
- Chromium (Playwright) 412×823 com CPU 4× mais lenta e rede loopback sem limite;
- coluna "HTML completo" (`responseEnd` da navegação).

Por rota: 1 visita de aquecimento descartada e 10 medidas, das quais sai o p75. `/entrar` foi
medida sem sessão; as outras com a conta do seed de dev usada pelo e2e. Para não favorecer quem
roda primeiro, foram 2 rodadas alternadas (`main`, branch, `main`, branch). O script ficou fora do
repositório, como na 018.

## Rotas que mudaram de modo no build

Nenhuma. Antes e depois, as mesmas rotas aparecem como `ƒ (Dynamic)`, e o
`.next/prerender-manifest.json` só tem `/_global-error` (research R7).

## HTML completo, p75 (ms)

| Rota | `main` r1 | branch r1 | `main` r2 | branch r2 | Média `main` → branch | Variação |
|------|-----------|-----------|-----------|-----------|-----------------------|----------|
| `/entrar` | 7 | 6 | 9 | 6 | 8 → 6 | −25% |
| `/` | 26 | 20 | 27 | 18 | 26,5 → 19 | −28% |
| `/grupos` | 27 | 29 | 25 | 21 | 26 → 25 | −4% |
| `/perfil` | 14 | 17 | 16 | 13 | 15 → 15 | 0% |

## Decisão

Nenhuma rota piorou acima de 20% (SC-006); não há o que mitigar. As diferenças são de poucos
milissegundos e mudam de sinal entre rodadas (`/perfil`: +21% na 1ª, −19% na 2ª). São ruído da
medição local, não ganho: o custo real é gerar 16 bytes aleatórios e montar uma string por
requisição no proxy.

## Página de erro do layout raiz (quickstart §5)

Checagem feita no build local com o layout raiz forçado a lançar um erro (mudança descartada
depois). Em `/termos`:
- a resposta é 500, com a política completa (`script-src` com nonce);
- a tela "Algo deu errado — Kotta Groups" aparece;
- "Tentar de novo" dispara uma nova requisição a `/`, o que mostra que os scripts rodaram;
- nenhuma violação de CSP e nenhum erro de página.

`/_global-error` continuar pré-gerada não atrapalha: o Next a renderiza na mesma requisição, com o
nonce dela.
