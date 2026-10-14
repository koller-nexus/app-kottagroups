import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { InvoiceStatus } from "@/components/app/invoice-status";
import { Page, SectionLabel } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import { InvoiceUploadForm } from "@/components/forms/invoice-upload-form";
import { ApiError } from "@/lib/api/errors";
import { getGroup, getMe, listGroupInvoicesPage } from "@/lib/api/kotta";
import { formatShortDate } from "@/lib/dates";
import { isInvoicePending, isInvoiceRead, reaisToCents } from "@/lib/invoices";
import { localDay } from "@/lib/kotta-view";
import { displayName, peopleById } from "@/lib/people";

export const metadata: Metadata = {
  title: "Notas — Kotta Groups",
};

export default async function GrupoNotasPage({ params, searchParams }: PageProps<"/grupos/[id]/notas">) {
  const { id } = await params;
  const { cursor: rawCursor } = await searchParams;
  const cursor = typeof rawCursor === "string" ? rawCursor : undefined;

  const loaded = await Promise.all([getMe(), getGroup(id), listGroupInvoicesPage(id, cursor)]).catch((error) => {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  });
  const [me, group, page] = loaded;
  const names = peopleById([group]);

  return (
    <Page
      back={{ href: `/grupos/${group.id}`, label: <>{group.emoji} {group.name}</> }}
      title="Notas"
      description="Fotos de notas fiscais do grupo. A Kotta Groups lê o estabelecimento, a data e os itens."
    >
      {group.archived ? null : (
        <section aria-labelledby="enviar">
          <SectionLabel id="enviar">Enviar nota</SectionLabel>
          <div className="rounded-card border border-kotta-border bg-kotta-surface p-6">
            <InvoiceUploadForm groupId={group.id} />
          </div>
        </section>
      )}

      <section aria-labelledby="notas-do-grupo">
        <SectionLabel id="notas-do-grupo">Notas do grupo</SectionLabel>
        {page.items.some((invoice) => isInvoicePending(invoice.status)) ? <AutoRefresh /> : null}
        {page.items.length === 0 ? (
          <p className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-10 text-center text-sm text-kotta-muted">
            {cursor ? "Não há mais notas." : "Nenhuma nota enviada ainda."}
          </p>
        ) : (
          <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {page.items.map((invoice) => {
              const day = invoice.issuedOn ?? localDay(invoice.createdAt);
              return (
                <li key={invoice.id}>
                  <Link
                    href={`/grupos/${group.id}/notas/${invoice.id}`}
                    className="flex min-h-[68px] items-center gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-base font-semibold text-kotta-text">
                        {invoice.establishment || invoice.originalName}
                      </span>
                      <span className="text-[13px] text-kotta-muted">
                        {invoice.issuedOn ? "Emitida em " : "Enviada em "}
                        {formatShortDate(day)}
                        {invoice.shoppingListId
                          ? " · Comprovante da lista"
                          : ` · por ${displayName(names, invoice.uploadedByUserId, me.id)}`}
                        {invoice.expenseId ? " · Vinculada a uma despesa" : ""}
                      </span>
                    </span>
                    {isInvoiceRead(invoice.status) ? (
                      <Price cents={reaisToCents(invoice.estimatedTotal)} size={18} />
                    ) : null}
                    <InvoiceStatus status={invoice.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {cursor ? (
            <Link href={`/grupos/${group.id}/notas`} className="secondary-action">
              Voltar ao início
            </Link>
          ) : null}
          {page.hasMore && page.nextCursor ? (
            <Link
              href={`/grupos/${group.id}/notas?cursor=${encodeURIComponent(page.nextCursor)}`}
              className="secondary-action"
            >
              Carregar mais
            </Link>
          ) : null}
        </div>
      </section>
    </Page>
  );
}
