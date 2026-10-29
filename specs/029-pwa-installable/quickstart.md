# Quickstart: validar a PWA

## Pré-requisitos

- `pnpm install`; `API_ORIGIN` definido (como nas outras suítes).
- O SW só registra em produção: `pnpm build && pnpm start` (porta 3002 nos scripts).

## Automático

```bash
pnpm test        # lib/install-prompt.test.mjs, lib/service-worker.test.mjs, lib/csp.test.mjs
pnpm lint
pnpm test:e2e    # e2e/pwa.spec.ts: manifest, /sw.js sem cache, /offline.html sem CSP de nonce, sem violação de CSP
```

## Manual (Chrome)

1. Abrir `http://localhost:3002/` → DevTools → Application → Manifest: sem erros, ícones 192/512
   (any e maskable) e "Installable".
2. Application → Service Workers: `sw.js` ativo. Cache Storage: só `kotta-offline-v1` com 4 arquivos.
3. Banner "Instale o Kotta Groups…" aparece; "Instalar" abre o diálogo; "Agora não" some e, após
   recarregar, não volta (limpar `kotta:install-dismissed:v1` para repetir).
4. Network → Offline, recarregar: página "Sem conexão". "Tentar de novo" ainda offline: mensagem
   anunciada. Voltar online e tocar: carrega a página.
5. Entrar na conta, usar o app, ficar offline e navegar para `/grupos`: só "Sem conexão", nenhum dado
   de conta; Cache Storage continua com os 4 arquivos.
6. Instalar e abrir o app: janela própria, banner ausente.

## Manual (iPhone/iPad Safari)

Banner com a instrução de Compartilhar → Adicionar à Tela de Início; depois de instalado, abre sem
barra do Safari e sem banner. Conferir em 375px.
