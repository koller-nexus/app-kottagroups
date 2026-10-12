import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { InvoiceStatus } from "@/components/app/invoice-status";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import { InvoiceUploadForm } from "@/components/forms/invoice-upload-form";
import { listInvoicesPage } from "@/lib/api/kotta";
import { formatShortDate } from "@/lib/dates";
import { isInvoicePending, reaisToCents } from "@/lib/invoices";
import { localDay } from "@/lib/kotta-view";

export const metadata: Metadata = {
  title: "Notas — Kotta Groups",
};

export default async function NotasPage({ searchParams }: PageProps<"/notas">) {
  const { cursor } = await searchParams;
  const page = await listInvoicesPage(typeof cursor === "string" ? cursor : undefined);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notas"
        description="Envie a foto de uma nota fiscal e a Kotta Groups lê o estabelecimento, a data e os itens."
      />

      <section aria-labelledby="enviar" className="mt-8">
        <SectionLabel id="enviar">Enviar nota</SectionLabel>
        <div className="rounded-card border border-kotta-border bg-kotta-surface p-6">
          <InvoiceUploadForm />
        </div>
      </section>

      <section aria-labelledby="suas-notas" className="mt-8">
        <SectionLabel id="suas-notas">Suas notas</SectionLabel>
        {page.items.some((invoice) => isInvoicePending(invoice.status)) ? <AutoRefresh /> : null}
        {page.items.length === 0 ? (
          <p className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-10 text-center text-sm text-kotta-muted">
            {cursor ? "Não há mais notas." : "Nenhuma nota enviada ainda."}
          </p>
        ) : (
          <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {page.items.map((invoice) => {
              const ready = invoice.status === "done" || invoice.status === "needs_review";
              const day = invoice.issuedOn ?? localDay(invoice.createdAt);
              return (
                <li key={invoice.id}>
                  <Link
                    href={`/notas/${invoice.id}`}
                    className="flex min-h-[68px] items-center gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-base font-semibold text-kotta-text">
                        {invoice.establishment || invoice.originalName}
                      </span>
                      <span className="text-[13px] text-kotta-muted">
                        {invoice.issuedOn ? "Emitida em " : "Enviada em "}
                        {formatShortDate(day)}
                      </span>
                    </span>
                    {ready ? <Price cents={reaisToCents(invoice.estimatedTotal)} size={18} /> : null}
                    <InvoiceStatus status={invoice.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {cursor ? (
            <Link href="/notas" className="secondary-action">
              Voltar ao início
            </Link>
          ) : null}
          {page.hasMore && page.nextCursor ? (
            <Link href={`/notas?cursor=${encodeURIComponent(page.nextCursor)}`} className="secondary-action">
              Carregar mais
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
