# Contrato de interface: estados de progresso

Interface exposta ao usuário (não há API nova). Textos em português do Brasil.

## Componente `Spinner`

- Props: `label?: string`, `size?: "sm" | "md"` (padrão `md`).
- Saída: anel `aria-hidden` + `label` visível ao lado, quando houver.
- Movimento: `motion-safe:animate-spin`; sem movimento o anel fica estático.
- Não anuncia nada sozinho: quem o usa coloca o texto em um `role="status"`.

## Regiões `role="status"`

| Local | Texto por estado |
|-------|------------------|
| Envio de foto (lista de compras) | "Preparando a foto…" → "Procurando QR code…" → "Enviando a nota…" |
| Envio por QR escaneado ou chave | "Enviando a nota…" |
| Envio no grupo (`InvoiceUploadForm`) | "Enviando a nota…" |
| Aviso na lista de compras (`ReceiptStatus`) | "Na fila para ser lida" / "Lendo sua nota…" + "Pode sair da tela; seguimos lendo." / "Está demorando mais que o normal." / "Nota lida" |
| Tela da nota (`notas/[notaId]`) | "Na fila para ser lida" / "Lendo sua nota…" + "Pode sair da tela; seguimos lendo. Esta página se atualiza sozinha." |
| Selo de status (`InvoiceStatus`) | rótulo existente ("Na fila", "Lendo a nota") com Spinner `sm` à esquerda |

## Regras

- Botões de envio ficam `disabled` enquanto houver etapa ativa.
- Erro: indicador some, `FormError` aparece, botões reativam.
- Texto só muda quando a etapa muda (sem reanunciar a cada polling).
