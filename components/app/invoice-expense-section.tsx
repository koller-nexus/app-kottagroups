import Link from "next/link";
import { SectionLabel } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import { InvoiceLinkForm, InvoiceUnlinkButton } from "@/components/forms/invoice-link-form";
import type { ApiExpense, ApiInvoice } from "@/lib/api/types";
import { formatShortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { invoiceDifferenceCents, linkableExpenses } from "@/lib/invoices";
import { localDay } from "@/lib/kotta-view";

interface InvoiceExpenseSectionProps {
  invoice: ApiInvoice;
  groupId: string;
  /** Despesas recentes do grupo (até 100). */
  expenses: ApiExpense[];
  archived: boolean;
}

/** "Despesa" no detalhe da nota: o vínculo atual, a diferença de valores e o seletor. */
export function InvoiceExpenseSection({ invoice, groupId, expenses, archived }: InvoiceExpenseSectionProps) {
  const linked = invoice.expenseId ? expenses.find((expense) => expense.id === invoice.expenseId) : undefined;
  const difference = linked ? invoiceDifferenceCents(invoice, linked) : null;
  const options = linkableExpenses(expenses, invoice).map((expense) => ({
    id: expense.id,
    label: `${expense.description} (${formatBRL(expense.amountCents)}, ${formatShortDate(localDay(expense.createdAt))})`,
  }));
  const noExpenseToLink = !invoice.expenseId && !archived && options.length === 0;
  const fields = {
    invoiceId: invoice.id,
    groupId,
    returnTo: `/grupos/${groupId}/notas/${invoice.id}`,
    previousExpenseId: invoice.expenseId ?? "",
  };

  return (
    <section aria-labelledby="despesa-vinculada">
      <SectionLabel id="despesa-vinculada">Despesa</SectionLabel>
      <div className="flex flex-col gap-5 rounded-card border border-kotta-border bg-kotta-surface p-6">
        {invoice.expenseId ? (
          <p className="text-base text-kotta-text">
            Vinculada a{" "}
            <Link href={`/despesas/${invoice.expenseId}`} className="font-semibold text-kotta-primary hover:underline">
              {linked?.description ?? "uma despesa do grupo"}
            </Link>
            {linked ? (
              <>
                {" "}
                de <Price cents={linked.amountCents} size={15} />
              </>
            ) : null}
            .
          </p>
        ) : noExpenseToLink ? (
          <p className="text-sm text-kotta-muted">Registre uma despesa neste grupo para vincular esta nota.</p>
        ) : (
          <p className="text-sm text-kotta-muted">Esta nota ainda não comprova nenhuma despesa.</p>
        )}

        {difference ? (
          <p role="status" className="rounded-control bg-kotta-danger-bg p-4 text-sm text-kotta-danger">
            O total da nota está {formatBRL(Math.abs(difference))} {difference > 0 ? "acima" : "abaixo"} do valor da
            despesa.
          </p>
        ) : null}

        {archived ? null : (
          <>
            {options.length > 0 ? (
              <InvoiceLinkForm
                fields={fields}
                selectName="expenseId"
                label={invoice.expenseId ? "Trocar por outra despesa" : "Vincular a uma despesa"}
                options={options}
                selectedId={invoice.expenseId}
                submitLabel={invoice.expenseId ? "Trocar despesa" : "Vincular"}
              />
            ) : noExpenseToLink ? null : (
              <p className="text-sm text-kotta-muted">Não há despesas sem nota neste grupo.</p>
            )}
            {invoice.expenseId ? <InvoiceUnlinkButton fields={fields} /> : null}
          </>
        )}
      </div>
    </section>
  );
}
