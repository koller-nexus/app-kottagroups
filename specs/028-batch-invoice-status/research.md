# Research: status das notas em lote

## R1. Onde chamar a consulta em lote

- **Decision**: nova função `getInvoiceStatuses(ids)` em `lib/api/kotta.ts`, ao lado de `getInvoice`,
  chamando `GET /invoices/status?ids=a,b` pelo `apiRequest`. Sem `cache()`: a rota chama uma vez por
  requisição.
- **Rationale**: `lib/api/kotta.ts` já concentra as chamadas à API e já importa `server-only` pelo
  `apiRequest`. O `apiRequest` já desembrulha `data`, repassa o IP do navegador (spec 026) e trata
  sessão expirada.
- **Alternatives considered**: `fetch` direto na rota (duplicaria cabeçalhos, sessão e erros).

## R2. Formato do id aceito pela rota

- **Decision**: `parseStatusIds` passa a aceitar só o ULID canônico, o mesmo que o `model.IsID` da
  API (`ulid.ParseStrict` + `String() == s`): 26 caracteres Crockford em maiúsculas, primeiro
  caractere de `0` a `7`. Regex `^[0-7][0-9A-HJKMNP-TV-Z]{25}$`.
- **Rationale**: a API recusa o lote inteiro com 400 quando um único id é inválido. Validar igual no
  app faz um id ruim virar 400 na rota (FR-004), sem gastar uma chamada à API e sem derrubar as
  outras notas com 503. Os ids vêm da própria API, então nenhum id real é recusado.
- **Alternatives considered**:
  - Manter `^[A-Za-z0-9_-]{1,64}$` e tratar o 400 da API como 400 da rota. Gasta uma chamada para
    algo que dá para saber antes.
  - Filtrar os ids inválidos e consultar o resto. Esconde erro de programação na tela.

## R3. Repetidos

- **Decision**: `parseStatusIds` já remove repetidos com `Set`; nada muda. A API recusa repetidos,
  então essa regra passa a ser obrigatória (FR-005), coberta pelo teste existente.

## R4. Erros

- **Decision**: a rota mantém o `catch` atual: qualquer `ApiError` (400, 429, 5xx) vira 503
  `Service unavailable`; sessão expirada continua no `apiRequest`. `skipMissing` sai (FR-008), porque
  a API omite as notas sem acesso.
- **Rationale**: a tela já trata 503 como falha do ciclo e tenta no próximo. 429 agora só ocorre se a
  pessoa estourar o limite de verdade.

## R5. e2e com várias notas

- **Decision**:
  - O proxy de mock aplica `invoiceOverrides` também aos itens de `GET /api/v1/invoices/status`
    (hoje só aplica em `GET /api/v1/invoices/:id`). Assim o `setInvoice` dos testes continua valendo
    para o acompanhamento.
  - Novo teste em `e2e/notes-notifications.spec.ts`, no `describe` serial "notas do grupo": envia uma
    segunda nota, deixa as duas em `processing` pela simulação e abre a lista de notas do grupo.
  - O teste limpa `/__mock/last-headers` depois do carregamento e espera um ciclo. Confere que a API
    recebeu `/api/v1/invoices/status` e nenhum `/api/v1/invoices/<id>`. Confere também que a
    resposta da rota traz as duas notas com o status simulado.
  - Por fim, marca as duas como `done` e confere que a tela recarrega e mostra as duas lidas.
- **Rationale**: `/__mock/last-headers` já registra cada chamada a `/api/v1` em ordem (spec 026),
  então dá para contar as chamadas sem mexer no app. A lista do grupo é a tela que acompanha várias
  notas de uma vez.
- **Alternatives considered**: simular o lote inteiro no mock. Não testaria o contrato real nem a
  regra de acesso da API.
- **Atenção**: `INVOICE_PATH` (`/^\/api\/v1\/invoices\/([^/]+)$/`) também casa
  `/api/v1/invoices/status`, com id `status`. A checagem do lote vem antes dessa.

## R6. Ordem de deploy

- **Decision**: sem flag nem fallback. A API com a spec 095 (`VERSION` 0.19.0, PR api#256) já está
  em `main`. O e2e roda contra uma API com essa versão.
