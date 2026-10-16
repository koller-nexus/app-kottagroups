"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import type { ApiGroupDetail } from "@/lib/api/types";
import { failure, text, type FormState } from "@/lib/form";

// Grupos e membros aparecem no menu do shell e mudam os saldos (sino): as actions daqui
// invalidam o app inteiro ("/", "layout").

const groupPath = (id: string) => `/groups/${encodeURIComponent(id)}`;

/**
 * Ações de botão (sem useActionState): erro da API volta para `back` com
 * `?erro=CODIGO`, e a página mostra a mensagem amigável.
 */
async function act(path: string, method: "POST" | "DELETE", back: string, body?: Record<string, unknown>) {
  try {
    await apiRequest<unknown>(path, { method, body });
  } catch (error) {
    if (error instanceof ApiError) redirect(`${back}?erro=${encodeURIComponent(error.code)}`);
    throw error;
  }
  revalidatePath("/", "layout");
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

export async function updateGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const groupId = text(formData, "groupId");
  const name = text(formData, "name");
  const emoji = text(formData, "emoji") || "👥";
  const values = { name, emoji };
  if (!groupId) return { error: "Grupo não encontrado.", values };
  if (!name) return { error: "Dê um nome ao grupo.", values };

  try {
    await apiRequest<ApiGroupDetail>(groupPath(groupId), { method: "PATCH", body: { name, emoji } });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  redirect(`/grupos/${groupId}`);
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  if (!groupId) return;
  await act(groupPath(groupId), "DELETE", `/grupos/${groupId}`);
  redirect("/grupos");
}

export async function archiveGroupAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  if (!groupId) return;
  await act(`${groupPath(groupId)}/archive`, "POST", `/grupos/${groupId}`);
}

export async function unarchiveGroupAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  if (!groupId) return;
  await act(`${groupPath(groupId)}/unarchive`, "POST", `/grupos/${groupId}`);
}

export async function addMemberAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  const userId = text(formData, "userId");
  if (!groupId || !userId) return;
  await act(`${groupPath(groupId)}/members`, "POST", `/grupos/${groupId}/membros`, { userId });
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  const userId = text(formData, "userId");
  if (!groupId || !userId) return;
  await act(
    `${groupPath(groupId)}/members/${encodeURIComponent(userId)}`,
    "DELETE",
    `/grupos/${groupId}/membros`,
  );
}

export async function promoteMemberAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  const userId = text(formData, "userId");
  if (!groupId || !userId) return;
  await act(
    `${groupPath(groupId)}/members/${encodeURIComponent(userId)}/admin`,
    "POST",
    `/grupos/${groupId}/membros`,
  );
}
