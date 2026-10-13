"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api/server";
import type { ApiReceiptAccepted, ApiShoppingItem, ApiShoppingListDetail } from "@/lib/api/types";
import { failure, text, type FormState } from "@/lib/form";
import { accessKeyFromQrUrl, accessKeyProblem, normalizeAccessKey } from "@/lib/receipt";
import { parseQuantity, validateItemName, validateListName, validateReceipt } from "@/lib/shopping";

const enc = encodeURIComponent;

export async function createShoppingListAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const groupId = text(formData, "groupId");
  const name = text(formData, "name");
  const values = { name };
  if (!groupId) return { error: "Grupo não encontrado.", values };
  const invalid = validateListName(name);
  if (invalid) return { error: invalid, values };

  let list: ApiShoppingListDetail;
  try {
    list = await apiRequest<ApiShoppingListDetail>(`/groups/${enc(groupId)}/shopping-lists`, {
      method: "POST",
      body: { name },
    });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  redirect(`/grupos/${enc(groupId)}/listas/${enc(list.id)}`);
}

export async function renameShoppingListAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const listId = text(formData, "listId");
  const name = text(formData, "name");
  const values = { name };
  if (!listId) return { error: "Lista não encontrada.", values };
  const invalid = validateListName(name);
  if (invalid) return { error: invalid, values };

  try {
    await apiRequest(`/shopping-lists/${enc(listId)}`, { method: "PATCH", body: { name } });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  return { ok: true, values };
}

export async function deleteShoppingListAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  const listId = text(formData, "listId");
  if (!groupId || !listId) return;
  await apiRequest(`/shopping-lists/${enc(listId)}`, { method: "DELETE" });
  revalidatePath("/", "layout");
  redirect(`/grupos/${enc(groupId)}`);
}

export async function addShoppingItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const listId = text(formData, "listId");
  const name = text(formData, "name");
  const rawQuantity = text(formData, "quantity") || "1";
  const values = { name, quantity: rawQuantity };
  if (!listId) return { error: "Lista não encontrada.", values };
  const invalid = validateItemName(name);
  if (invalid) return { error: invalid, values };
  const quantity = parseQuantity(rawQuantity);
  if (quantity === null) return { error: "A quantidade deve ser um número inteiro de 1 a 9999.", values };

  try {
    await apiRequest<ApiShoppingItem>(`/shopping-lists/${enc(listId)}/items`, {
      method: "POST",
      body: { name, quantity },
    });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  // Volta vazio para o próximo item.
  return { ok: true };
}

/** Edita nome e quantidade do item. */
export async function updateShoppingItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const itemId = text(formData, "itemId");
  const name = text(formData, "name");
  const rawQuantity = text(formData, "quantity");
  const values = { name, quantity: rawQuantity };
  if (!itemId) return { error: "Item não encontrado.", values };
  const invalid = validateItemName(name);
  if (invalid) return { error: invalid, values };
  const quantity = parseQuantity(rawQuantity);
  if (quantity === null) return { error: "A quantidade deve ser um número inteiro de 1 a 9999.", values };

  try {
    await apiRequest<ApiShoppingItem>(`/shopping-items/${enc(itemId)}`, {
      method: "PATCH",
      body: { name, quantity },
    });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  return { ok: true, values };
}

/** Marca ou desmarca o item como comprado. */
export async function toggleShoppingItemAction(formData: FormData): Promise<void> {
  const itemId = text(formData, "itemId");
  if (!itemId) return;
  await apiRequest<ApiShoppingItem>(`/shopping-items/${enc(itemId)}`, {
    method: "PATCH",
    body: { completed: text(formData, "completed") === "true" },
  });
  revalidatePath("/", "layout");
}

export async function deleteShoppingItemAction(formData: FormData): Promise<void> {
  const itemId = text(formData, "itemId");
  if (!itemId) return;
  await apiRequest(`/shopping-items/${enc(itemId)}`, { method: "DELETE" });
  revalidatePath("/", "layout");
}

export async function uploadReceiptAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const listId = text(formData, "listId");
  const file = formData.get("file");
  if (!listId) return { error: "Lista não encontrada." };
  if (!(file instanceof File)) return { error: "Escolha um arquivo para enviar." };
  const invalid = validateReceipt(file);
  if (invalid) return { error: invalid };

  // Reenvia só o arquivo; a API confere o tipo pelo conteúdo.
  const body = new FormData();
  body.append("file", file, file.name || "nota-fiscal");
  try {
    await apiRequest<ApiReceiptAccepted>(`/shopping-lists/${enc(listId)}/receipt`, { method: "POST", body });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Nota pelo QR code lido na câmera ou pela chave de acesso digitada. */
export async function submitReceiptCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const listId = text(formData, "listId");
  const qrUrl = text(formData, "qrUrl");
  const rawKey = text(formData, "accessKey");
  if (!listId) return { error: "Lista não encontrada." };
  if (Boolean(qrUrl) === Boolean(rawKey)) return { error: "Escaneie o QR code ou digite a chave de acesso." };

  let body: { qrUrl: string } | { accessKey: string };
  if (qrUrl) {
    if (!accessKeyFromQrUrl(qrUrl)) return { error: "Esse QR não parece de nota fiscal." };
    body = { qrUrl };
  } else {
    const accessKey = normalizeAccessKey(rawKey);
    if (!accessKey) return { error: accessKeyProblem(rawKey) ?? "Confira a chave de acesso.", values: { accessKey: rawKey } };
    body = { accessKey };
  }

  try {
    await apiRequest<ApiReceiptAccepted>(`/shopping-lists/${enc(listId)}/receipt`, { method: "POST", body });
  } catch (error) {
    return failure(error, rawKey ? { accessKey: rawKey } : undefined);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteReceiptAction(formData: FormData): Promise<void> {
  const listId = text(formData, "listId");
  if (!listId) return;
  await apiRequest(`/shopping-lists/${enc(listId)}/receipt`, { method: "DELETE" });
  revalidatePath("/", "layout");
}

const MATCH_DECISIONS = new Set(["confirmed", "rejected"]);

/** Sim / Não em um item "Confere?". Rejeitar desfaz o comprado na API. */
export async function decideMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const matchId = text(formData, "matchId");
  const status = text(formData, "status");
  if (!matchId || !MATCH_DECISIONS.has(status)) return { error: "Não foi possível conferir este item." };

  try {
    await apiRequest(`/shopping-item-matches/${enc(matchId)}`, { method: "PATCH", body: { status } });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
