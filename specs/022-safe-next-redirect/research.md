# Research: destino de retorno ("next") nunca leva para outro site

Os casos abaixo foram conferidos em Node 24 com a implementação de R2 (script descartável, mesmo
parser WHATWG usado pelo Next e pelos navegadores).

## R1. Onde corrigir

- **Decision**: corrigir só `safeNextPath` em `lib/safe-next.ts`.
- **Rationale**: as 13 chamadas (sair, entrar, cadastrar, confirme-seu-email, sessao-expirada,
  `app/actions/auth.ts`, `app/actions/invoices.ts`, `lib/session-flow.ts`, `lib/api/server.ts`) já
  passam por ela. Uma correção ali fecha a variante de `/sair` e a pós-login (FR-006), sem mexer em
  quem chama.
- **Alternatives considered**: validar em cada ponto de uso (duplica a regra e deixa pontos de fora);
  validar no `proxy.ts` (não cobre `formData` das Server Actions).

## R2. Como conferir

- **Decision**: a regra da issue, em quatro passos:
  1. não é texto, não começa com `/`, ou tem caractere de controle (0x00–0x1F), DEL ou `\` em
     qualquer posição → destino padrão;
  2. resolver contra uma base fictícia (`http://n.invalid`) com `new URL`;
  3. origem diferente da base → destino padrão;
  4. montar `pathname + search + hash`; se começar com `//` → destino padrão; senão devolver.
- **Rationale**: é o próprio parser que o navegador usa, então "o que o app aceita" e "para onde o
  navegador vai" coincidem. O passo 1 corta TAB/LF/CR antes que o parser os descarte. O passo 4
  pega `/.//x`, `/..//x`, `/%2e//x` e `/x/..//y`, que o parser normaliza para `//x` e que,
  resolvidos de novo no redirect, viram outra origem. `n.invalid` usa o TLD reservado `.invalid`.
- **Alternatives considered**: lista de prefixos proibidos (é o que falhou: sempre falta um);
  regex de caminho permitido (recusaria caminhos com acento e `%xx` legítimos); dependência de
  sanitização de URL (constituição I: resolvível em ~6 linhas com `URL`).

## R3. Forma devolvida

- **Decision**: devolver o caminho normalizado, não o texto original.
- **Rationale**: é o que foi conferido. Sem isso, um texto que passa na checagem pode ser lido de
  outro jeito na segunda resolução. Efeitos colaterais aceitos: `/grupos/../perfil` vira `/perfil`;
  caracteres fora de ASCII viram `%xx` (`/grupos/ção` → `/grupos/%C3%A7%C3%A3o`), que o navegador
  trata como o mesmo endereço.
- **Alternatives considered**: devolver o original quando o normalizado passa (dois valores para a
  mesma decisão; sem ganho).

## R4. Codificados que continuam aceitos

- **Decision**: `/%09/x` e `/%5c/x` (com o `%` literal, não decodificado) são aceitos como caminhos
  internos.
- **Rationale**: `searchParams.get` e `formData.get` já decodificam, então o ataque `?next=/%09/x`
  chega como `/\t/x` e cai no passo 1. Um `%09` que sobra literal não é descartado pelo navegador:
  `/%09/x` resolve para o próprio app (verificado). Recusar não muda a segurança.

## R5. Idempotência

- **Decision**: `safeNextPath(safeNextPath(x)) === safeNextPath(x)` para todo `x`.
- **Rationale**: o destino passa duas vezes em alguns fluxos (por exemplo `expiredSessionUrl` →
  `/sair`, que confere de novo). A saída já está normalizada e codificada, então a segunda passada
  devolve o mesmo texto; um teste fixa isso.

## R6. Próprio `n.invalid` como destino

- **Decision**: nada a fazer.
- **Rationale**: o valor precisa começar com `/`, então nunca nomeia um host; a origem da base só
  serve de régua no passo 3.

## R7. Escopo da API

- **Decision**: sem mudança na API.
- **Rationale**: os redirecionamentos com `next` são todos do front (spec, Assumptions).
