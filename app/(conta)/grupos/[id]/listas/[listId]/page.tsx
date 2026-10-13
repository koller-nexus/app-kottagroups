import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteReceiptAction, deleteShoppingListAction } from "@/app/actions/shopping";
import { Page, SectionLabel } from "@/components/app/page-header";
import { ShoppingProgressBar } from "@/components/app/shopping-lists-card";
import {
  AddShoppingItemForm,
  ConfirmSubmit,
  ShoppingItemRow,
  ShoppingListNameForm,
} from "@/components/forms/shopping-forms";
import { ReceiptCapture } from "@/components/receipt/receipt-capture";
import { ReceiptStatus } from "@/components/receipt/receipt-status";
import { ReceiptSummary } from "@/components/receipt/receipt-summary";
import { getGroup, getReceiptOrNull, getShoppingList } from "@/lib/api/kotta";
import { ApiError } from "@/lib/api/errors";
import type { ApiReceiptSummary, ApiShoppingReceipt } from "@/lib/api/types";
import { formatShortDate } from "@/lib/dates";
import { invoiceErrorMessage } from "@/lib/invoices";
import { formatBRL } from "@/lib/money";
import { isReceiptProcessed, itemMatchState, matchSummary, matchSummaryLabel } from "@/lib/receipt";
import { formatFileSize, progressLabel } from "@/lib/shopping";

const linkClass =
  "inline-flex min-h-11 items-center text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/grupos/[id]/listas/[listId]">): Promise<Metadata> {
  const { listId } = await params;
  try {
    const list = await getShoppingList(listId);
    return { title: `${list.name} — Kotta Groups` };
  } catch {
    return { title: "Lista de compras — Kotta Groups" };
  }
}

export default async function ListaPage({ params }: PageProps<"/grupos/[id]/listas/[listId]">) {
  const { id, listId } = await params;
  const [group, list, receipt] = await Promise.all([
    orNotFound(getGroup(id)),
    orNotFound(getShoppingList(listId)),
    orNotFound(getReceiptOrNull(listId)),
  ]);
  if (list.groupId !== group.id) notFound();

  const readOnly = group.archived;
  const completed = list.items.filter((item) => item.completed).length;
  const total = list.items.length;
  const processed = isReceiptProcessed(receipt?.status);
  const invoiceItemByShoppingItem = new Map(
    (receipt?.matches ?? []).map((match) => [match.shoppingItemId, match.invoiceItem]),
  );

  return (
    <Page
      back={{ href: `/grupos/${group.id}`, label: group.name }}
      title={list.name}
      description={
        <span className="flex max-w-sm flex-col gap-2">
          <span className="text-[13px]">
            {total === 0 ? "Nenhum item ainda" : `${progressLabel(completed, total)} comprados`}
            {readOnly ? " · grupo arquivado" : ""}
          </span>
          <ShoppingProgressBar completed={completed} total={total} />
          {processed && total > 0 ? (
            <span className="text-[13px] text-kotta-text">
              {matchSummaryLabel(matchSummary(list.items))}
              {receipt?.status === "done" ? ` · nota de ${formatBRL(receipt.totalCents)}` : ""}
            </span>
          ) : null}
        </span>
      }
    >
      {readOnly ? (
        <p className="rounded-control border border-kotta-border bg-kotta-surface px-4 py-3 text-sm text-kotta-muted">
          Este grupo está arquivado. A lista fica só para consulta.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <ReceiptArea receipt={receipt} listId={list.id} readOnly={readOnly} />
          <section aria-labelledby="itens" className="min-w-0">
            <SectionLabel id="itens">Itens</SectionLabel>
            {total === 0 ? (
              <p className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
                {readOnly ? "Esta lista não tem itens." : "Sua lista está vazia. Adicione o primeiro item."}
              </p>
            ) : (
              <ul className="divide-y divide-kotta-border overflow-hidden rounded-card border border-kotta-border bg-kotta-surface">
                {list.items.map((item) => (
                  <li key={item.id}>
                    <ShoppingItemRow
                      item={item}
                      readOnly={readOnly}
                      matchState={itemMatchState(item, processed)}
                      invoiceItem={invoiceItemByShoppingItem.get(item.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {readOnly ? null : (
              <div className="mt-4">
                <AddShoppingItemForm listId={list.id} />
              </div>
            )}
          </section>
          {receipt && processed ? <ReceiptSummary receipt={receipt} listId={list.id} readOnly={readOnly} /> : null}
        </div>

        <aside aria-label="Detalhes da lista" className="flex flex-col gap-8">
          {readOnly ? null : (
            <section aria-labelledby="nome-da-lista">
              <SectionLabel id="nome-da-lista">Nome</SectionLabel>
              <div className="rounded-card border border-kotta-border bg-kotta-surface p-4">
                <ShoppingListNameForm listId={list.id} defaultName={list.name} />
              </div>
            </section>
          )}

          {readOnly ? null : (
            <form action={deleteShoppingListAction}>
              <input type="hidden" name="groupId" value={group.id} />
              <input type="hidden" name="listId" value={list.id} />
              <ConfirmSubmit
                message="Excluir a lista? Os itens e a nota fiscal serão removidos permanentemente."
                className={`text-kotta-danger ${linkClass}`}
              >
                Excluir lista
              </ConfirmSubmit>
            </form>
          )}
        </aside>
      </div>
    </Page>
  );
}

/** Topo da lista: capturar a nota, acompanhar a leitura ou a nota antiga só como arquivo. */
function ReceiptArea({
  receipt,
  listId,
  readOnly,
}: {
  receipt: ApiShoppingReceipt | null;
  listId: string;
  readOnly: boolean;
}) {
  if (receipt && receipt.status === null) {
    return (
      <section aria-label="Nota fiscal" className="flex flex-col gap-4 rounded-card border border-kotta-border bg-kotta-surface p-4">
        <ReceiptPreview receipt={receipt} />
        {readOnly ? null : (
          <form action={deleteReceiptAction}>
            <input type="hidden" name="listId" value={listId} />
            <ConfirmSubmit
              message="Remover a nota fiscal? Os itens continuam na lista."
              className={`text-kotta-danger ${linkClass}`}
            >
              Remover nota fiscal
            </ConfirmSubmit>
          </form>
        )}
      </section>
    );
  }
  if (readOnly) return null;
  const status = receipt?.status;
  if (!receipt || !status || status === "failed") {
    const failedMessage = receipt ? invoiceErrorMessage(receipt.errorMessage ?? undefined) : undefined;
    return <ReceiptCapture listId={listId} failedMessage={failedMessage} />;
  }
  return <ReceiptStatus status={status} />;
}

function ReceiptPreview({ receipt }: { receipt: ApiReceiptSummary }) {
  const file = receipt.file;
  if (!file) return null;
  const isImage = file.contentType.startsWith("image/");
  const kind = isImage ? `Imagem ${file.contentType.slice(6).toUpperCase()}` : "PDF";
  return (
    <div className="flex flex-col gap-3">
      {isImage && file.url ? (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-control border border-kotta-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
        >
          {/* URL assinada e temporária do armazenamento: next/image não ajuda aqui. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt="Nota fiscal da lista" className="max-h-72 w-full bg-kotta-bg object-contain" />
        </a>
      ) : null}
      <p className="text-sm text-kotta-text">
        {kind} · {formatFileSize(file.sizeBytes)} · enviada em {formatShortDate(receipt.uploadedAt.slice(0, 10))}
      </p>
      {file.url ? (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-kotta-primary ${linkClass}`}
        >
          Abrir nota fiscal
        </a>
      ) : (
        <p className="text-[13px] text-kotta-muted">O link da nota fiscal não está disponível agora.</p>
      )}
    </div>
  );
}
