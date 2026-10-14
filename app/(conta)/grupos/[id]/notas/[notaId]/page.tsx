import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInvoiceAction } from "@/app/actions/invoices";
import { FormError } from "@/components/auth/field";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { InvoiceExpenseSection } from "@/components/app/invoice-expense-section";
import { InvoiceFailedRecovery } from "@/components/app/invoice-failed-recovery";
import { InvoiceStatus } from "@/components/app/invoice-status";
import { Spinner } from "@/components/app/spinner";
import { Page, SectionLabel } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { getGroup, getInvoice, getMe, listExpensesPage } from "@/lib/api/kotta";
import { formatLongDay } from "@/lib/dates";
import {
  canLinkInvoice,
  invoiceErrorMessage,
  invoiceRiskLabel,
  isInvoicePending,
  isInvoiceRead,
  parseInvoiceItems,
  reaisToCents,
} from "@/lib/invoices";
import { canDeleteInvoice } from "@/lib/permissions";
import { READING_LEAVE_HINT, readingMessage } from "@/lib/receipt";
import { displayName, peopleById } from "@/lib/people";

export const metadata: Metadata = {
  title: "Nota — Kotta Groups",
};

export default async function GrupoNotaPage({ params, searchParams }: PageProps<"/grupos/[id]/notas/[notaId]">) {
  const { id, notaId } = await params;
  const { confirmar, erro } = await searchParams;

  const loaded = await Promise.all([getMe(), getGroup(id), getInvoice(notaId), listExpensesPage(id)]).catch(
    (error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
      throw error;
    },
  );
  const [me, group, invoice, expenses] = loaded;
  // A URL pode misturar o grupo de uma nota com outro grupo do usuário.
  if (invoice.groupId !== group.id) notFound();

  const pending = isInvoicePending(invoice.status);
  const ready = isInvoiceRead(invoice.status);
  const items = ready ? parseInvoiceItems(invoice.items) : [];
  const role = group.members.find((member) => member.id === me.id)?.role;
  const detailHref = `/grupos/${group.id}/notas/${invoice.id}`;
  const deletable =
    !group.archived && !pending && !invoice.sentFromList && canDeleteInvoice(me.id, invoice.uploadedByUserId, role);

  return (
    <Page
      width="reading"
      back={{ href: `/grupos/${group.id}/notas`, label: "Notas" }}
      title={invoice.establishment || "Nota fiscal"}
      description={
        invoice.sentFromList && invoice.shoppingListId ? (
          <Link href={`/grupos/${group.id}/listas/${invoice.shoppingListId}`} className="hover:underline">
            Comprovante da lista de compras
          </Link>
        ) : (
          <>
            {`${invoice.originalName}, enviada por ${displayName(peopleById([group]), invoice.uploadedByUserId, me.id, { object: true })}`}
            {invoice.shoppingListId ? (
              <>
                {" · "}
                <Link href={`/grupos/${group.id}/listas/${invoice.shoppingListId}`} className="hover:underline">
                  Ver lista de compras
                </Link>
              </>
            ) : null}
          </>
        )
      }
      actions={
        <>
          <InvoiceStatus status={invoice.status} />
          {deletable ? (
            <Link href={`${detailHref}?confirmar=excluir`} replace className="secondary-action text-kotta-danger!">
              Excluir
            </Link>
          ) : null}
        </>
      }
    >
      {typeof erro === "string" && erro ? (
        <div>
          <FormError message={friendlyMessage(erro)} />
        </div>
      ) : null}

      {deletable && confirmar === "excluir" ? (
        <ConfirmDelete
          title="Excluir esta nota?"
          action={deleteInvoiceAction}
          fields={{ invoiceId: invoice.id, groupId: group.id, previousExpenseId: invoice.expenseId ?? "" }}
          confirmLabel="Excluir nota"
          cancelHref={detailHref}
        >
          A foto e a leitura somem do grupo, e a despesa vinculada fica sem nota. Não dá para desfazer.
        </ConfirmDelete>
      ) : null}

      {pending ? <AutoRefresh /> : null}
      {/* Vazio quando a nota está pronta; escondido para não somar espaço na pilha. */}
      <div aria-live="polite" className="empty:hidden">
        {pending ? (
          <div className="flex flex-col gap-1 rounded-card border border-kotta-border bg-kotta-surface p-6">
            <p className="text-sm font-semibold text-kotta-text">
              <Spinner label={readingMessage(invoice.status, false) ?? undefined} />
            </p>
            <p className="text-[13px] text-kotta-muted">{READING_LEAVE_HINT} Esta página se atualiza sozinha.</p>
          </div>
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

      {invoice.status === "failed" && !group.archived ? <InvoiceFailedRecovery groupId={group.id} /> : null}

      {canLinkInvoice(invoice) ? (
        <InvoiceExpenseSection
          invoice={invoice}
          groupId={group.id}
          expenses={expenses.items}
          archived={group.archived}
        />
      ) : null}
    </Page>
  );
}
