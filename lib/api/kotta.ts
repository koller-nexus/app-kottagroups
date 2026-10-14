import "server-only";
import { cache } from "react";
import { ApiError } from "@/lib/api/errors";
import { apiRequest, withQuery } from "@/lib/api/server";
import type {
  ApiCategory,
  ApiExpense,
  ApiExpenseDetail,
  ApiGroupDetail,
  ApiGroupSummary,
  ApiInvoice,
  ApiNotification,
  ApiSettlement,
  ApiShoppingListDetail,
  ApiShoppingListSummary,
  ApiShoppingReceipt,
  ApiUser,
  CursorPage,
} from "@/lib/api/types";

const PAGE_LIMIT = 100;
// Teto de páginas por varredura, para não prender a renderização.
const MAX_PAGES = 10;

export const getMe = cache(() => apiRequest<ApiUser>("/users/me"));

export const listGroups = cache(async (archived = false): Promise<ApiGroupSummary[]> => {
  const all: ApiGroupSummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await apiRequest<CursorPage<ApiGroupSummary>>(
      withQuery("/groups", { limit: PAGE_LIMIT, cursor, archived }),
    );
    all.push(...result.items);
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return all;
});

export const getGroup = cache((id: string) =>
  apiRequest<ApiGroupDetail>(`/groups/${encodeURIComponent(id)}`),
);

/** Detalhe de todos os grupos ativos, em paralelo. */
export const listGroupDetails = cache(async (): Promise<ApiGroupDetail[]> => {
  const groups = await listGroups();
  return Promise.all(groups.map((group) => getGroup(group.id)));
});

export const listExpensesPage = cache(
  (groupId: string, limit: number = PAGE_LIMIT, cursor?: string, category?: string) =>
    apiRequest<CursorPage<ApiExpense>>(
      withQuery(`/groups/${encodeURIComponent(groupId)}/expenses`, { limit, cursor, category }),
    ),
);

export const getExpense = cache((id: string) =>
  apiRequest<ApiExpenseDetail>(`/expenses/${encodeURIComponent(id)}`),
);

export const getGroupBalances = cache(async (groupId: string) => {
  const result = await apiRequest<{ balances: ApiGroupDetail["balances"] }>(
    `/groups/${encodeURIComponent(groupId)}/balances`,
  );
  return result.balances;
});

/**
 * Despesas do grupo criadas a partir de `sinceIso`. A API devolve da mais
 * nova para a mais antiga, então a varredura para na primeira mais antiga.
 */
export async function listExpensesSince(groupId: string, sinceIso: string): Promise<ApiExpense[]> {
  const out: ApiExpense[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await listExpensesPage(groupId, PAGE_LIMIT, cursor);
    for (const expense of result.items) {
      if (expense.createdAt < sinceIso) return out;
      out.push(expense);
    }
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return out;
}

export const listSettlements = cache(async (groupId: string) => {
  const result = await apiRequest<{ settlements: ApiSettlement[] }>(
    `/groups/${encodeURIComponent(groupId)}/settlements`,
  );
  return result.settlements;
});

export const listCategories = cache(async () => {
  const result = await apiRequest<{ items: ApiCategory[] }>("/categories");
  return result.items;
});

export const listNotificationsPage = cache(
  async (status: "unpaid" | "all", limit = 20, cursor?: string) =>
    apiRequest<CursorPage<ApiNotification>>(
      withQuery("/notifications", { status, limit, cursor }),
    ),
);

export const getNotificationCount = cache(async () => {
  const result = await apiRequest<{ count: number }>("/notifications/count");
  return result.count;
});

export const listShoppingListsPage = cache((groupId: string, cursor?: string) =>
  apiRequest<CursorPage<ApiShoppingListSummary>>(
    withQuery(`/groups/${encodeURIComponent(groupId)}/shopping-lists`, { limit: 20, cursor }),
  ),
);

export const getShoppingList = cache((id: string) =>
  apiRequest<ApiShoppingListDetail>(`/shopping-lists/${encodeURIComponent(id)}`),
);

export const getReceipt = cache((listId: string) =>
  apiRequest<ApiShoppingReceipt>(`/shopping-lists/${encodeURIComponent(listId)}/receipt`),
);

/** A API responde 404 quando a lista não tem nota. */
export async function getReceiptOrNull(listId: string): Promise<ApiShoppingReceipt | null> {
  try {
    return await getReceipt(listId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export const listGroupInvoicesPage = cache((groupId: string, cursor?: string, limit = 20) =>
  apiRequest<CursorPage<ApiInvoice>>(
    withQuery(`/groups/${encodeURIComponent(groupId)}/invoices`, { limit, cursor }),
  ),
);

export const getInvoice = cache((id: string) =>
  apiRequest<ApiInvoice>(`/invoices/${encodeURIComponent(id)}`),
);
