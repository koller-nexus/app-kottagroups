import Link from "next/link";
import { InvoiceStatus } from "@/components/app/invoice-status";
import { SectionLabel } from "@/components/app/page-header";
import { listGroupInvoicesPage } from "@/lib/api/kotta";
import { ApiError } from "@/lib/api/errors";
import type { ApiInvoice, CursorPage } from "@/lib/api/types";
import { formatShortDate } from "@/lib/dates";
import { localDay } from "@/lib/kotta-view";

const RECENT_INVOICES = 3;

/** "Notas" do grupo: as mais recentes e o caminho para enviar; falha da API fica só neste cartão. */
export async function GroupInvoicesCard({ groupId, archived }: { groupId: string; archived: boolean }) {
  let page: CursorPage<ApiInvoice> | null = null;
  let loadError: string | null = null;
  try {
    page = await listGroupInvoicesPage(groupId, undefined, RECENT_INVOICES);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    loadError =
      error.status === 403 ? "Você não tem acesso às notas deste grupo." : "Não foi possível carregar as notas.";
  }
  const notesHref = `/grupos/${groupId}/notas`;

  return (
    <section aria-labelledby={`notas-${groupId}`}>
      <SectionLabel id={`notas-${groupId}`}>Notas</SectionLabel>
      {loadError ? (
        <p role="alert" className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
          {loadError}
        </p>
      ) : page && page.items.length > 0 ? (
        <ul className="divide-y divide-kotta-border overflow-hidden rounded-card border border-kotta-border bg-kotta-surface">
          {page.items.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={`${notesHref}/${invoice.id}`}
                className="flex min-h-[60px] items-center gap-3 px-4 py-3 hover:bg-kotta-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kotta-primary"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base font-semibold text-kotta-text">
                    {invoice.establishment || invoice.originalName}
                  </span>
                  <span className="text-[13px] text-kotta-muted">
                    {formatShortDate(invoice.issuedOn ?? localDay(invoice.createdAt))}
                  </span>
                </span>
                <InvoiceStatus status={invoice.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
          Nenhuma nota enviada ainda.
        </p>
      )}
      {loadError ? null : (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={notesHref} className="secondary-action">
            {archived ? "Ver notas" : "Enviar ou ver notas"}
          </Link>
        </div>
      )}
    </section>
  );
}
