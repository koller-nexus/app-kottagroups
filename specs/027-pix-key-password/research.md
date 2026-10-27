# Research: Pedir a senha atual para trocar a chave Pix no perfil

Não restou nenhum NEEDS CLARIFICATION: o contrato da API está fechado em
`api-kottagroups/specs/094-pix-key-reauth/contracts/patch-users-me.md` (PR api#254).

## R1. Como a action sabe qual é a chave salva

- **Decision**: o formulário manda a chave salva num `<input type="hidden" name="savedPixKey">`,
  preenchido com a prop `pixKey` que a página lê de `/users/me`. Depois de salvar, o
  `revalidatePath` renderiza a página de novo, e a prop, junto com o campo oculto, passa a ter a
  chave nova.
- **Rationale**: não acrescenta chamada à API e funciona sem JavaScript. O campo é controlável pelo
  navegador, mas isso não é uma brecha. A API decide se a chave mudou e exige a senha de qualquer
  jeito. Se alguém adulterar o campo, no máximo recebe "senha obrigatória" ou manda uma chave
  igual à salva.
- **Alternatives considered**:
  - Buscar `/users/me` na action: é uma chamada a mais por salvamento, sem ganho de segurança.
  - Ler do `_prev` do `useActionState`: depois de uma recusa ele guarda o valor digitado, não o
    salvo; também vem do navegador.

## R2. O que conta como "a chave mudou"

- **Decision**: `isPixKeyChange(typed, saved)` compara `typed.trim()` com `saved`. A chave salva
  vem da API já normalizada. Chave vazia com chave salva conta como remoção, ou seja, mudança.
- **Rationale**: é a regra que o formulário consegue aplicar sem duplicar a normalização da API. Se
  só o formato for diferente (ex.: telefone com máscara), o app mostra o campo de senha. Se a
  pessoa salvar sem senha, a API trata como "sem mudança" e aceita (edge case da spec).
- **Alternatives considered**: copiar a normalização de chave da API no front. Seriam duas fontes
  de verdade, e o ganho seria só esconder o campo num caso raro.

## R3. Corpo do PATCH

- **Decision**: `name` vai sempre. `pixKey` e `currentPassword` vão só quando `isPixKeyChange`. A
  remoção manda `pixKey: null`. A senha vai como foi digitada, sem `trim`, como em `loginAction`
  (`rawText`).
- **Rationale**: atende ao FR-001 e ao FR-004. Mandar o nome sem mudança é inofensivo e mantém o
  comportamento atual. O contrato ignora `currentPassword` quando a chave não muda, mas não
  enviá-la evita trafegar a senha à toa.
- **Alternatives considered**: mandar só os campos que mudaram, nome incluído. Exigiria um campo
  oculto a mais só para o nome, sem benefício.

## R4. Onde o erro de senha aparece e o que volta ao navegador

- **Decision**: a action devolve `{ passwordError, values: { name, pixKey } }`. A tradução é feita
  por `passwordErrorMessage(code, retryAfter)`:

  | Código da API | Mensagem |
  |---------------|----------|
  | `CURRENT_PASSWORD_REQUIRED` | "Digite sua senha atual para trocar a chave Pix." |
  | `CURRENT_PASSWORD_INVALID` | "Senha incorreta." |
  | `RATE_LIMITED` | `rateLimitMessage(retryAfter)` |

  Qualquer outro código segue em `failure()`, como hoje, e aparece no erro geral do topo.
- **Rationale**:
  - `RATE_LIMITED` só acontece neste PATCH ao checar a senha, então a mensagem pertence ao campo.
  - `values` nunca inclui a senha (FR-009).
  - O campo de senha não tem `defaultValue`, então o reset do formulário pelo React depois da
    action o deixa vazio (FR-008).
- **Alternatives considered**:
  - Pôr tudo no erro geral do topo: contraria o FR-005 e o FR-006.
  - Generalizar `FieldErrors` e `useFieldErrors`: muda a tipagem dos formulários de autenticação
    por um único campo.

## R5. Mostrar o campo e levar o foco ao erro

- **Decision**:
  - O formulário guarda em estado se a chave digitada difere da `savedPixKey`, atualizado no
    `onChange` do campo da chave.
  - A cada novo estado do servidor, esse valor é recalculado a partir de `state.values.pixKey`
    (mesmo padrão `seenState` de `useFieldErrors`).
  - O campo aparece quando a chave muda ou quando há `passwordError`.
  - Um `useEffect` em `state` foca o campo de senha quando há `passwordError`.
  - O erro é ligado ao campo por `aria-describedby` (já feito pelo `Field`).
- **Rationale**:
  - Sem JavaScript, ou antes da hidratação, o campo só aparece depois da recusa da API, que traz
    `passwordError` (edge case da spec).
  - O foco no campo faz o leitor de tela anunciar o rótulo e o erro, como nos formulários de
    autenticação.
- **Alternatives considered**: deixar o campo sempre visível. Atrapalha a edição de nome (história
  2) e não diz à pessoa quando a senha é necessária.

## R6. E2E sem esgotar o limite de tentativas

- **Decision**: três testes novos em `e2e/profile.spec.ts`:
  1. **Só o nome**: troca o nome para `E2E nome <runId>` sem senha, na API real. Nenhum campo de
     senha aparece; o nome novo aparece no resumo da conta.
  2. **Chave sem senha**: força o envio sem o campo, ou envia com ele vazio, na API real. O
     `CURRENT_PASSWORD_REQUIRED` vem antes do limitador e não conta tentativa. O erro aparece no
     campo e a chave digitada continua lá.
  3. **Chave com senha**:
     - Senha errada pelo mock: `PUT /__mock/fail` com
       `{ path: "/api/v1/users/me", method: "PATCH", status: 403, code: "CURRENT_PASSWORD_INVALID" }`.
       O erro aparece no campo e a pessoa continua em `/perfil`.
     - Depois `clearApiFailures()` e a senha certa (`E2E_PASSWORD`), na API real. A chave muda para
       `e2e-<runId>@example.com` e aparece no resumo.

  O mock passa a aceitar `method` (padrão `GET`) e `code` (padrão `SERVICE_UNAVAILABLE`), com a
  chave do mapa `failures` sendo `"<METHOD> <path>"`.
- **Rationale**:
  - Cada execução faz uma única checagem de senha real, contra o limite de 5 por 15 min.
  - O caso de senha errada não precisa da API real: o que se testa é a tradução e a exibição no
    front.
  - Não restaurar a chave evita uma segunda checagem.
- **Alternatives considered**: senha errada na API real. Seriam 2 checagens por execução, e três
  execuções seguidas travariam o usuário de teste por 15 minutos.

## R7. Fora do escopo

- O e-mail de aviso, o evento de segurança e o limite de tentativas são da API.
- Mostrar/ocultar senha (`addon` do `Field`): o login já tem, mas não foi pedido. Fica para quando
  alguém pedir.
- Restaurar a chave original do usuário de teste no e2e (R6).
