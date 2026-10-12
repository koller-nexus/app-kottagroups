import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { InvoiceStatus } from "@/components/app/invoice-status";
import { Page, SectionLabel } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import { ApiError } from "@/lib/api/errors";
import { getInvoice } from "@/lib/api/kotta";
import type { ApiInvoice } from "@/lib/api/types";
import { formatLongDay } from "@/lib/dates";
import {
  invoiceErrorMessage,
  invoiceRiskLabel,
  isInvoicePending,
  parseInvoiceItems,
  reaisToCents,
} from "@/lib/invoices";

export const metadata: Metadata = {
  title: "Nota — Kotta Groups",
};

export default async function NotaPage({ params }: PageProps<"/notas/[id]">) {
  const { id } = await params;
  let invoice: ApiInvoice;
  try {
    invoice = await getInvoice(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const pending = isInvoicePending(invoice.status);
  const ready = invoice.status === "done" || invoice.status === "needs_review";
  const items = ready ? parseInvoiceItems(invoice.items) : [];

  return (
    <Page
      width="reading"
      back={{ href: "/notas", label: "Notas" }}
      title={invoice.establishment || "Nota fiscal"}
      description={invoice.originalName}
      actions={<InvoiceStatus status={invoice.status} />}
    >
      {pending ? <AutoRefresh /> : null}
      {/* Vazio quando a nota está pronta; escondido para não somar espaço na pilha. */}
      <div aria-live="polite" className="empty:hidden">
        {pending ? (
          <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
            Estamos lendo a nota. Esta página se atualiza sozinha.
          </p>
        ) : null}

        {invoice.status === "failed" ? (
          <p role="alert" className="rounded-card bg-kotta-danger-bg p-6 text-sm text-kotta-danger">
            {invoiceErrorMessage(invoice.errorMessage)}
          </p>
        ) : null}
      </div>

      {ready ? (
        <>
          {invoice.needsReview || invoice.status === "needs_review" ? (
            <p className="rounded-card bg-kotta-danger-bg p-6 text-sm text-kotta-danger">
              Confira os dados antes de usar: a leitura pode ter errado
              {invoice.riskLabel ? ` (risco ${invoiceRiskLabel(invoice.riskLabel)})` : ""}.
            </p>
          ) : null}

          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-kotta-border bg-kotta-border sm:grid-cols-3">
            <div className="bg-kotta-surface p-5">
              <dt className="text-[13px] font-semibold text-kotta-muted">Emitida em</dt>
              <dd className="mt-1 text-base text-kotta-text">
                {invoice.issuedOn ? formatLongDay(invoice.issuedOn) : "Não identificada"}
              </dd>
            </div>
            <div className="bg-kotta-surface p-5">
              <dt className="text-[13px] font-semibold text-kotta-muted">Total da nota</dt>
              <dd className="mt-1 text-kotta-text">
                <Price cents={reaisToCents(invoice.estimatedTotal)} size={24} />
              </dd>
            </div>
            <div className="bg-kotta-surface p-5">
              <dt className="text-[13px] font-semibold text-kotta-muted">Soma dos itens</dt>
              <dd className="mt-1 text-kotta-text">
                <Price cents={reaisToCents(invoice.itemsTotal)} size={24} />
              </dd>
            </div>
          </dl>

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
      ) : null}
    </Page>
  );
}
