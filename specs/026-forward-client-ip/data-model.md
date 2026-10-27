# Data Model: Repassar o IP do navegador à API

Sem banco nem estado persistido. Dois valores por chamada:

| Entidade | Origem | Validação | Destino |
|----------|--------|-----------|---------|
| IP do navegador | `x-real-ip`, senão 1º item de `x-forwarded-for` da requisição recebida | `isIP(valor) ∈ {4, 6}`; senão descartado | `X-Kotta-Client-IP` |
| Segredo do front | `KOTTA_BFF_SECRET` (env do servidor) | não vazio | `X-Kotta-Bff-Secret` |

## Decisão por chamada

| Segredo | IP válido | Cabeçalhos enviados |
|---------|-----------|---------------------|
| ausente | — | nenhum (+ aviso único em produção) |
| presente | não | nenhum |
| presente | sim | os dois |

Valores com esses nomes vindos do navegador nunca entram na decisão.
