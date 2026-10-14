import Link from "next/link";
import { SectionLabel } from "@/components/app/page-header";
import { InvoiceLinkForm, InvoiceUnlinkButton } from "@/components/forms/invoice-link-form";
import { InvoiceUploadForm } from "@/components/forms/invoice-upload-form";
import { ApiError } from "@/lib/api/errors";
import { listGroupInvoicesPage } from "@/lib/api/kotta";
import type { ApiExpense, ApiInvoice } from "@/lib/api/types";
import { formatShortDate } from "@/lib/dates";
import { unlinkedInvoices } from "@/lib/invoices";
import { localDay } from "@/lib/kotta-view";

/** Notas soltas para o seletor; sem elas (ou com a API fora) a despesa ainda aceita foto nova. */
async function loadUnlinked(groupId: string): Promise<ApiInvoice[]> {
  try {
    // ponytail: só a primeira página (20); paginar o seletor se grupos acumularem notas soltas.
    return unlinkedInvoices((await listGroupInvoicesPage(groupId)).items);
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
}

/** "Nota" no detalhe da despesa: a nota vinculada ou como anexar uma. */
export async function ExpenseInvoiceSection({ expense, archived }: { expense: ApiExpense; archived: boolean }) {
  const returnTo = `/despesas/${expense.id}`;
  const notesHref = `/grupos/${expense.groupId}/notas`;

  if (expense.invoiceId) {
    return (
      <section aria-labelledby="nota-da-despesa">
        <SectionLabel id="nota-da-despesa">Nota</SectionLabel>
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-kotta-border bg-kotta-surface p-6">
          <Link href={`${notesHref}/${expense.invoiceId}`} className="primary-action">
            Ver a nota
          </Link>
          {archived ? null : (
            <InvoiceUnlinkButton
              fields={{
                invoiceId: expense.invoiceId,
                groupId: expense.groupId,
                returnTo,
                previousExpenseId: expense.id,
              }}
            />
          )}
        </div>
      </section>
    );
  }

  if (archived) return null;
  const unlinked = await loadUnlinked(expense.groupId);

  return (
    <section aria-labelledby="nota-da-despesa">
      <SectionLabel id="nota-da-despesa">Nota</SectionLabel>
      <div className="flex flex-col gap-6 rounded-card border border-kotta-border bg-kotta-surface p-6">
        <InvoiceUploadForm groupId={expense.groupId} expenseId={expense.id} />
        {unlinked.length > 0 ? (
          <InvoiceLinkForm
            fields={{ expenseId: expense.id, groupId: expense.groupId, returnTo }}
            selectName="invoiceId"
            label="Ou escolha uma nota já enviada ao grupo"
            options={unlinked.map((invoice) => ({
              id: invoice.id,
              label: `${invoice.establishment || invoice.originalName} (${formatShortDate(invoice.issuedOn ?? localDay(invoice.createdAt))})`,
            }))}
            submitLabel="Vincular"
          />
        ) : null}
      </div>
    </section>
  );
}
