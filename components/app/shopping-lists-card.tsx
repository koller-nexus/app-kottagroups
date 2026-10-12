import Link from "next/link";
import { SectionLabel } from "@/components/app/page-header";
import { ShoppingListNameForm } from "@/components/forms/shopping-forms";
import { listShoppingListsPage } from "@/lib/api/kotta";
import { ApiError } from "@/lib/api/errors";
import type { ApiShoppingListSummary, CursorPage } from "@/lib/api/types";
import { progressLabel } from "@/lib/shopping";

export function ShoppingProgressBar({ completed, total }: { completed: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-kotta-border">
      <span className="block h-full rounded-full bg-kotta-primary" style={{ width: `${percent}%` }} />
    </span>
  );
}

/** "Listas de compras" do grupo; falha da API fica só neste cartão. */
export async function ShoppingListsCard({ groupId, archived }: { groupId: string; archived: boolean }) {
  let page: CursorPage<ApiShoppingListSummary> | null = null;
  let loadError: string | null = null;
  try {
    page = await listShoppingListsPage(groupId);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    loadError =
      error.status === 403
        ? "Você não tem acesso às listas deste grupo."
        : "Não foi possível carregar as listas de compras.";
  }

  return (
    <section aria-labelledby={`listas-${groupId}`}>
      <SectionLabel id={`listas-${groupId}`}>Listas de compras</SectionLabel>
      {loadError ? (
        <p role="alert" className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
          {loadError}
        </p>
      ) : page && page.items.length > 0 ? (
        <ul className="divide-y divide-kotta-border overflow-hidden rounded-card border border-kotta-border bg-kotta-surface">
          {page.items.map((list) => (
            <li key={list.id}>
              <Link
                href={`/grupos/${groupId}/listas/${list.id}`}
                className="flex min-h-[68px] flex-col justify-center gap-2 px-4 py-3 hover:bg-kotta-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kotta-primary"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-base font-semibold text-kotta-text">{list.name}</span>
                  <span className="shrink-0 text-[13px] text-kotta-muted">
                    {progressLabel(list.progress.completedItems, list.progress.totalItems)}
                  </span>
                </span>
                <ShoppingProgressBar completed={list.progress.completedItems} total={list.progress.totalItems} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
          Nenhuma lista ainda.{archived ? "" : " Crie uma para combinar o que comprar."}
        </p>
      )}
      {page?.hasMore ? (
        // ponytail: só a primeira página (20); paginar com ?listasCursor= se grupos tiverem muitas listas.
        <p className="mt-3 text-center text-[13px] text-kotta-muted">
          Mostrando as {page.items.length} listas mais recentes.
        </p>
      ) : null}
      {archived || loadError ? null : (
        <div className="mt-4">
          <ShoppingListNameForm groupId={groupId} />
        </div>
      )}
    </section>
  );
}
