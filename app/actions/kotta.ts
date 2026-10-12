"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import type { ApiExpense, ApiGroupDetail, ApiSettlement, ApiUser } from "@/lib/api/types";
import { parseAmountToCents } from "@/lib/kotta-view";

export interface FormState {
  error?: string;
  ok?: boolean;
  values?: Record<string, string>;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function failure(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof ApiError) return { error: friendlyMessage(error.code), values };
  throw error;
}

export async function createGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const emoji = text(formData, "emoji") || "👥";
  const values = { name, emoji };
  if (!name) return { error: "Dê um nome ao grupo.", values };

  let group: ApiGroupDetail;
  try {
    group = await apiRequest<ApiGroupDetail>("/groups", { method: "POST", body: { name, emoji } });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  redirect(`/grupos/${group.id}`);
}

export async function createExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const groupId = text(formData, "groupId");
  const description = text(formData, "description");
  const amount = text(formData, "amount");
  const category = text(formData, "category");
  const paidByUserId = text(formData, "paidByUserId");
  const values = { groupId, description, amount, category, paidByUserId };

  if (!groupId) return { error: "Escolha o grupo da despesa.", values };
  if (!description) return { error: "Descreva a despesa.", values };
  const amountCents = parseAmountToCents(amount);
  if (amountCents === null) return { error: "Informe um valor válido, como 25,90.", values };
  if (!category) return { error: "Escolha uma categoria.", values };
  if (!paidByUserId) return { error: "Diga quem pagou.", values };

  try {
    await apiRequest<ApiExpense>(`/groups/${encodeURIComponent(groupId)}/expenses`, {
      method: "POST",
      body: { description, amountCents, category, paidByUserId, splitType: "equal" },
    });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  redirect(`/grupos/${groupId}`);
}

export async function markSettlementPaidAction(formData: FormData): Promise<void> {
  const settlementId = text(formData, "settlementId");
  if (!settlementId) return;
  await apiRequest<ApiSettlement>(`/settlements/${encodeURIComponent(settlementId)}/paid`, {
    method: "POST",
  });
  revalidatePath("/", "layout");
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const pixKey = text(formData, "pixKey");
  const values = { name, pixKey };
  if (!name) return { error: "O nome não pode ficar vazio.", values };

  try {
    await apiRequest<ApiUser>("/users/me", {
      method: "PATCH",
      body: { name, pixKey: pixKey || null },
    });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  return { ok: true, values };
}
