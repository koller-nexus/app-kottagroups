import type { ReactNode } from "react";
import { SectionLabel } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import type { ApiInvoice } from "@/lib/api/types";
import { formatLongDay } from "@/lib/dates";
import { invoiceRiskLabel, invoiceSummary, parseInvoiceItems, TOTAL_TOLERANCE_CENTS } from "@/lib/invoices";

// Sem célula vazia na grade: cada contagem de células tem a sua divisão de colunas.
const SUMMARY_COLUMNS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/** O que a leitura extraiu de uma nota lida: aviso de revisão, totais e itens. */
export function InvoiceReading({ invoice }: { invoice: ApiInvoice }) {
  const items = parseInvoiceItems(invoice.items);
  const summary = invoiceSummary(invoice);
  // Na ordem da conta do cupom: valor dos itens − desconto = total.
  const cells: [string, ReactNode][] = [
    ["Emitida em", invoice.issuedOn ? formatLongDay(invoice.issuedOn) : "Não identificada"],
  ];
  if (summary.itemsCents > 0) cells.push(["Valor dos itens", <Price key="itens" cents={summary.itemsCents} size={24} />]);
  if (summary.discountCents > 0) {
    cells.push(["Desconto", <Price key="desconto" cents={summary.discountCents} sign="−" size={24} />]);
  }
  cells.push([
    "Total da nota",
    summary.totalCents > 0 ? <Price key="total" cents={summary.totalCents} size={24} /> : "Não identificado",
  ]);
  return (
    <>
      {invoice.needsReview || invoice.status === "needs_review" ? (
        <p className="rounded-card bg-kotta-danger-bg p-6 text-sm text-kotta-danger">
          Confira os dados antes de usar: a leitura pode ter errado
          {invoice.riskLabel ? ` (risco ${invoiceRiskLabel(invoice.riskLabel)})` : ""}.
        </p>
      ) : null}

      <dl
        className={`grid grid-cols-1 gap-px overflow-hidden rounded-card border border-kotta-border bg-kotta-border ${SUMMARY_COLUMNS[cells.length]}`}
      >
        {cells.map(([label, value]) => (
          <div key={label} className="bg-kotta-surface p-5">
            <dt className="text-[13px] font-semibold text-kotta-muted">{label}</dt>
            <dd className="mt-1 text-base text-kotta-text">{value}</dd>
          </div>
        ))}
      </dl>

      {Math.abs(summary.differenceCents) > TOTAL_TOLERANCE_CENTS ? (
        <p className="rounded-card bg-kotta-danger-bg p-6 text-sm text-kotta-danger">
          Os itens não fecham com o total: diferença de <Price cents={Math.abs(summary.differenceCents)} size={14} />.
          Confira com a foto.
        </p>
      ) : null}

      <section aria-labelledby="itens">
        <SectionLabel id="itens">Itens</SectionLabel>
        {items.length === 0 ? (
          <p className="text-sm text-kotta-muted">Não conseguimos separar os itens desta nota.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-kotta-border bg-kotta-surface">
            <table className="w-full text-left text-sm">
              <thead className="text-[13px] text-kotta-muted">
                <tr className="border-b border-kotta-border">
                  <th scope="col" className="px-4 py-3 font-semibold">Item</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Qtd.</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Unitário</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kotta-border text-kotta-text">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {item.quantity.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Price cents={item.unitCents} size={15} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Price cents={item.totalCents} size={15} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
