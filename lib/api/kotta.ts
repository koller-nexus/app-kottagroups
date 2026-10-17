import "server-only";
import { cache } from "react";
import { ApiError } from "@/lib/api/errors";
import { apiOrigin, apiRequest, withQuery } from "@/lib/api/server";
import type {
  ApiCategory,
  ApiDashboard,
  ApiExpense,
  ApiExpenseDetail,
  ApiGroupDetail,
  ApiGroupInvite,
  ApiGroupSummary,
  ApiInvitePreview,
  ApiInvoice,
  ApiNotification,
  ApiSettlement,
  ApiShoppingListDetail,
  ApiShoppingListSummary,
  ApiShoppingReceipt,
  ApiUser,
  CursorPage,
} from "@/lib/api/types";
import { INVITE_LIST_LIMIT } from "@/lib/invites";

const PAGE_LIMIT = 100;
// Teto de páginas por varredura, para não prender a renderização.
const MAX_PAGES = 10;
// Limite da API para `/groups` com `include`.
const GROUP_DETAILS_PAGE_LIMIT = 50;

export const getMe = cache(async () => {
  const me = await apiRequest<ApiUser>("/users/me");
  // Sem base URL configurada, a API devolve o link da foto relativo a ela, não à web.
  return me.avatarUrl ? { ...me, avatarUrl: new URL(me.avatarUrl, apiOrigin()).toString() } : me;
});

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

/** Detalhe (membros e saldos) de todos os grupos ativos (ou arquivados), em lote. */
export const listGroupDetails = cache(async (archived = false): Promise<ApiGroupDetail[]> => {
  const all: ApiGroupDetail[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await apiRequest<CursorPage<ApiGroupDetail>>(
      withQuery("/groups", { include: "members,balances", limit: GROUP_DETAILS_PAGE_LIMIT, cursor, archived }),
    );
    all.push(...result.items);
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return all;
});

export const getDashboard = cache(() => apiRequest<ApiDashboard>("/me/dashboard"));

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

export const listSettlements = cache(async (groupId: string) => {
  const result = await apiRequest<{ settlements: ApiSettlement[] }>(
    `/groups/${encodeURIComponent(groupId)}/settlements`,
  );
  return result.settlements;
});

export const listCategories = cache(async () => {
  const result = await apiRequest<{ items?: unknown }>("/categories");
  if (!Array.isArray(result?.items)) {
    console.error("[api] GET /categories -> resposta sem lista de categorias");
    throw new ApiError(502, "INVALID_RESPONSE", "Resposta de categorias em formato inesperado.");
  }
  return result.items as ApiCategory[];
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

/** Prévia pública do convite (sem sessão). O token vai no corpo, nunca na URL da API. */
export const previewInvite = cache((token: string) =>
  apiRequest<ApiInvitePreview>("/invites/preview", { method: "POST", auth: false, body: { token } }),
);

/** Primeira página dos convites do grupo (dono/admin), mais recentes primeiro. */
export const listGroupInvites = cache((groupId: string) =>
  apiRequest<CursorPage<ApiGroupInvite>>(
    withQuery(`/groups/${encodeURIComponent(groupId)}/invites`, { limit: INVITE_LIST_LIMIT }),
  ),
);
