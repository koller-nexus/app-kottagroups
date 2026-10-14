import { deleteReceiptAction } from "@/app/actions/shopping";
import { Price } from "@/components/app/price";
import { ConfirmSubmit } from "@/components/forms/shopping-forms";
import type { ApiShoppingReceipt } from "@/lib/api/types";
import { formatShortDate } from "@/lib/dates";
import { extractionMethodLabel, extraInvoiceItems, invoiceLineLabel, resolutionPathLabel } from "@/lib/receipt";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

/** Cartão da nota lida: onde, quando, quanto e o que veio nela além da lista. */
export function ReceiptSummary({
  receipt,
  listId,
  readOnly,
}: {
  receipt: ApiShoppingReceipt;
  listId: string;
  readOnly: boolean;
}) {
  const extras = extraInvoiceItems(receipt);
  const origin = resolutionPathLabel(receipt.resolutionPath);
  // O selo de origem é mais específico que o método; com ele, o método não repete a informação.
  const method = origin ? null : extractionMethodLabel(receipt.extractionMethod);
  const details = [receipt.issuedOn ? formatShortDate(receipt.issuedOn) : null, method].filter(Boolean).join(" · ");

  return (
    <section aria-labelledby="nota-lida" className="rounded-card border border-kotta-border bg-kotta-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="nota-lida" className="truncate text-base font-semibold text-kotta-text">
            {receipt.establishment?.name || "Estabelecimento não identificado"}
          </h2>
          {details ? <p className="mt-0.5 text-[13px] text-kotta-muted">{details}</p> : null}
          {origin ? (
            <p className="mt-1.5 inline-flex rounded-pill border border-kotta-border bg-kotta-light-green px-2.5 py-0.5 text-xs font-semibold text-kotta-text">
              {origin}
            </p>
          ) : null}
        </div>
        <Price cents={receipt.totalCents} size={20} className="shrink-0 text-kotta-text" />
      </div>

      {extras.length > 0 ? (
        <details className="mt-4 border-t border-kotta-border pt-3">
          <summary className={`inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-kotta-text ${focus}`}>
            Também na nota ({extras.length})
          </summary>
          <ul className="mt-1 flex flex-col gap-1.5">
            {extras.map((line) => (
              <li key={line.index} className="text-[13px] text-kotta-muted">
                {invoiceLineLabel(line)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {readOnly ? null : (
        <form action={deleteReceiptAction} className="mt-3">
          <input type="hidden" name="listId" value={listId} />
          <ConfirmSubmit
            message="Remover a nota fiscal? As marcações dos itens também saem."
            className={`inline-flex min-h-11 items-center text-sm font-semibold text-kotta-danger hover:underline ${focus}`}
          >
            Remover nota fiscal
          </ConfirmSubmit>
        </form>
      )}
    </section>
  );
}
