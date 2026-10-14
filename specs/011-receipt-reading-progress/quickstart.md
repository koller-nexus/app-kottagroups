# Quickstart: validar o andamento da leitura

## Pré-requisitos

- `pnpm install`; app rodando com `pnpm dev`; usuário em um grupo com uma lista de compras.
- Uma foto grande de nota com QR code, uma sem QR code e uma chave de acesso válida.

## Testes automatizados

```bash
pnpm test    # inclui as funções puras de mensagens e de "Nota lida" em lib/receipt.test.mjs
pnpm lint
pnpm build
```

## Cenários manuais

1. **Foto sem QR (US1)**: na lista, escolher a foto. Ver o indicador em até 200 ms com "Preparando a foto…"/"Procurando QR code…", depois "Enviando a nota…"; botões desativados; toque duplo não envia duas vezes.
2. **Foto com QR e chave (US1)**: repetir; ver "Enviando a nota…" com indicador.
3. **Envio com erro (US1)**: forçar falha (arquivo não imagem ou rede desligada); indicador some, erro aparece, botões voltam.
4. **Leitura (US2)**: após enviar, acompanhar a tela: "Na fila…" ou "Lendo sua nota…", frase de que pode sair, indicador girando; ao terminar, "Nota lida" e os itens, sem recarregar.
5. **Reabrir pronta (US2)**: abrir uma nota já lida; não aparece aviso nem "Nota lida".
6. **Demora (US2)**: esperar 2 min (ou reduzir o timeout em dev); indicador para, texto "mais que o normal", botão "Verificar de novo".
7. **Listas (US3)**: com nota em leitura, abrir a lista de notas do grupo; item com indicador; ao terminar, status final sem recarregar.
8. **Acessibilidade**: ativar "reduzir movimento" no sistema: anel parado, texto presente; com leitor de tela, cada etapa é anunciada uma vez.

## Resultado esperado

Todos os cenários passam e SC-001 a SC-006 do [spec.md](spec.md) são verificáveis.
