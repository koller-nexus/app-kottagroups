# Data Model: PWA instalável

Só estado local do navegador; nada vai para a API.

## Dispensa do aviso

| Campo | Tipo | Regra |
|-------|------|-------|
| chave `kotta:install-dismissed:v1` (localStorage) | string (timestamp em ms) | Presença = dispensado. Sem prazo. |

- Leitura/escrita em `try/catch`: erro de armazenamento = "não dispensado" ao ler, ignora ao gravar.
- Sem dados pessoais.

## Estado de instalação (derivado, não persistido)

| Entrada | Origem |
|---------|--------|
| `standalone` | `matchMedia("(display-mode: standalone)")` ou `navigator.standalone` |
| `ios` | `navigator.userAgent` (iPhone/iPad/iPod) ou Mac com `maxTouchPoints > 1` |
| `canPrompt` | `beforeinstallprompt` recebido e ainda não usado |
| `dismissed` | leitura da chave acima |
| `pathname` | rota atual |

Saída `installPromptVariant(...)`:

| Condição (em ordem) | Variante |
|---------------------|----------|
| `standalone` ou `dismissed` ou rota fora de `/` e `/grupos` | `null` |
| `canPrompt` | `"button"` |
| `ios` | `"ios"` |
| senão | `null` |

Transições: `button` → `null` ao instalar (`appinstalled`) ou ao dispensar; `ios` → `null` ao dispensar.

## Cache do service worker

Cache `kotta-offline-v1`: `/offline.html`, `/offline.css`, `/offline.js`, `/icons/icon-192.png`.
Nenhuma outra entrada é permitida (verificado em `lib/service-worker.test.mjs`).
