import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInvoiceAction } from "@/app/actions/invoices";
import { FormError } from "@/components/auth/field";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { InvoiceExpenseSection } from "@/components/app/invoice-expense-section";
import { InvoiceFailedRecovery } from "@/components/app/invoice-failed-recovery";
import { InvoicePhoto } from "@/components/app/invoice-photo";
import { InvoiceReading } from "@/components/app/invoice-reading";
import { InvoiceStatus } from "@/components/app/invoice-status";
import { Spinner } from "@/components/app/spinner";
import { Page } from "@/components/app/page-header";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { getGroup, getInvoice, getMe, listExpensesPage } from "@/lib/api/kotta";
import { canLinkInvoice, invoiceErrorMessage, isInvoicePending, isInvoiceRead } from "@/lib/invoices";
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
  const role = group.members.find((member) => member.id === me.id)?.role;
  const detailHref = `/grupos/${group.id}/notas/${invoice.id}`;
  const deletable =
    !group.archived && !pending && !invoice.sentFromList && canDeleteInvoice(me.id, invoice.uploadedByUserId, role);

  const content = (
    <>
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

      {ready ? <InvoiceReading invoice={invoice} /> : null}

      {invoice.status === "failed" && !group.archived ? <InvoiceFailedRecovery groupId={group.id} /> : null}

      {canLinkInvoice(invoice) ? (
        <InvoiceExpenseSection
          invoice={invoice}
          groupId={group.id}
          expenses={expenses.items}
          archived={group.archived}
        />
      ) : null}
    </>
  );

  return (
    <Page
      width={invoice.file ? "view" : "reading"}
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
      {invoice.file ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-8 lg:gap-12">{content}</div>
          {/* Depois dos dados no DOM: no celular a foto alta não empurra os totais para baixo. */}
          <aside aria-label="Foto enviada" className="lg:sticky lg:top-6 lg:self-start">
            <InvoicePhoto file={invoice.file} name={invoice.originalName} />
          </aside>
        </div>
      ) : (
        content
      )}
    </Page>
  );
}
