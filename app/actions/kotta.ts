"use server";

import { revalidatePath } from "next/cache";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import { avatarFileProblem } from "@/lib/avatar";
import type { ApiSettlement, ApiUser } from "@/lib/api/types";
import { failure, rawText, text, type FormState } from "@/lib/form";
import { passwordErrorMessage, profileUpdateBody } from "@/lib/profile-update";

// Quitações mudam o contador do sino; avatar e nome aparecem no shell. Todas as actions daqui
// afetam o shell, então invalidam o app inteiro ("/", "layout").

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

export async function updateAvatarAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const value = formData.get("file");
  const file = value instanceof File ? value : null;
  const problem = avatarFileProblem(file);
  if (problem || !file) return { error: problem ?? undefined };
  // Só o arquivo vai para a API, sem os campos internos do formulário.
  const body = new FormData();
  body.set("file", file);

  try {
    await apiRequest<ApiUser>("/users/me/avatar", { method: "POST", body });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.code === "VALIDATION_FAILED") return { error: "Escolha uma foto." };
    return { error: friendlyMessage(error.code, "Não foi possível atualizar a foto. Tente de novo.") };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Estado do formulário do perfil; a senha digitada nunca volta ao navegador. */
export type ProfileFormState = FormState & { passwordError?: string };

export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const name = text(formData, "name");
  const pixKey = text(formData, "pixKey");
  const values = { name, pixKey };
  if (!name) return { error: "O nome não pode ficar vazio.", values };

  const body = profileUpdateBody({
    name,
    pixKey,
    savedPixKey: text(formData, "savedPixKey"),
    currentPassword: rawText(formData, "currentPassword"),
  });
  try {
    await apiRequest<ApiUser>("/users/me", { method: "PATCH", body });
  } catch (error) {
    const passwordError = error instanceof ApiError ? passwordErrorMessage(error.code, error.retryAfter) : undefined;
    if (passwordError) return { passwordError, values };
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  return { ok: true, values };
}
