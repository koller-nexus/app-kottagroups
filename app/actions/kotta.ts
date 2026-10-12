"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/server";
import type { ApiSettlement, ApiUser } from "@/lib/api/types";
import { failure, text, type FormState } from "@/lib/form";

export type { FormState };

export async function markSettlementPaidAction(formData: FormData): Promise<void> {
  const settlementId = text(formData, "settlementId");
  if (!settlementId) return;
  await apiRequest<ApiSettlement>(`/settlements/${encodeURIComponent(settlementId)}/paid`, {
    method: "POST",
  });
  revalidatePath("/", "layout");
}

export async function undoSettlementPaidAction(formData: FormData): Promise<void> {
  const settlementId = text(formData, "settlementId");
  if (!settlementId) return;
  await apiRequest<ApiSettlement>(`/settlements/${encodeURIComponent(settlementId)}/paid`, {
    method: "DELETE",
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
