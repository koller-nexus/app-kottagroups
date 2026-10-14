"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import type { ApiInvoice } from "@/lib/api/types";
import { failure, text, type FormState } from "@/lib/form";
import { INVOICE_ACCEPT, INVOICE_MAX_BYTES } from "@/lib/invoices";
import { safeNextPath } from "@/lib/safe-next";

const INVALID_TYPE = "Envie uma imagem JPG, PNG, WebP ou TIFF.";

const invoicePath = (groupId: string, invoiceId: string) => `/grupos/${groupId}/notas/${invoiceId}`;

/** Grupo, lista de notas e despesas tocadas pela mudança. */
function revalidateInvoice(groupId: string, expenseIds: string[] = []) {
  revalidatePath(`/grupos/${groupId}`);
  revalidatePath(`/grupos/${groupId}/notas`, "layout");
  for (const expenseId of expenseIds) revalidatePath(`/despesas/${expenseId}`);
}

export async function uploadInvoiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const groupId = text(formData, "groupId");
  const expenseId = text(formData, "expenseId");
  if (!groupId) return { error: "Grupo não encontrado." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha a foto da nota." };
  if (file.size > INVOICE_MAX_BYTES) return { error: "O arquivo passa de 10 MB." };
  // Sem tipo no navegador (alguns TIFF) a API decide pelo conteúdo.
  if (file.type && !INVOICE_ACCEPT.includes(file.type)) return { error: INVALID_TYPE };

  const body = new FormData();
  body.set("file", file, file.name);
  if (expenseId) body.set("expenseId", expenseId);

  let invoice: ApiInvoice;
  try {
    invoice = await apiRequest<ApiInvoice>(`/groups/${encodeURIComponent(groupId)}/invoices`, {
      method: "POST",
      body,
    });
  } catch (error) {
    // A mensagem geral cita PDF, que notas não aceitam.
    if (error instanceof ApiError && error.code === "INVALID_RECEIPT_TYPE") return { error: INVALID_TYPE };
    return failure(error);
  }
  revalidateInvoice(groupId, expenseId ? [expenseId] : []);
  redirect(invoicePath(groupId, invoice.id));
}

/** Campos comuns de vincular, desvincular e excluir; null quando faltam ids. */
function readInvoiceForm(formData: FormData) {
  const invoiceId = text(formData, "invoiceId");
  const groupId = text(formData, "groupId");
  if (!invoiceId || !groupId) return null;
  const returnTo = safeNextPath(text(formData, "returnTo"), invoicePath(groupId, invoiceId));
  // Despesa que perde ou troca a nota também precisa recarregar.
  const previousExpenseId = text(formData, "previousExpenseId");
  return { invoiceId, groupId, returnTo, previousExpenseId };
}

function withError(path: string, code: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}erro=${encodeURIComponent(code)}`;
}

export async function linkInvoiceAction(formData: FormData): Promise<void> {
  const form = readInvoiceForm(formData);
  const expenseId = text(formData, "expenseId");
  if (!form) return;
  if (!expenseId) redirect(withError(form.returnTo, "VALIDATION_FAILED"));
  try {
    await apiRequest<ApiInvoice>(`/invoices/${encodeURIComponent(form.invoiceId)}/expense`, {
      method: "PUT",
      body: { expenseId },
    });
  } catch (error) {
    if (error instanceof ApiError) redirect(withError(form.returnTo, error.code));
    throw error;
  }
  revalidateInvoice(form.groupId, [expenseId, form.previousExpenseId].filter(Boolean));
  redirect(form.returnTo);
}

export async function unlinkInvoiceAction(formData: FormData): Promise<void> {
  const form = readInvoiceForm(formData);
  if (!form) return;
  try {
    await apiRequest<ApiInvoice>(`/invoices/${encodeURIComponent(form.invoiceId)}/expense`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) redirect(withError(form.returnTo, error.code));
    throw error;
  }
  revalidateInvoice(form.groupId, [form.previousExpenseId].filter(Boolean));
  redirect(form.returnTo);
}

export async function deleteInvoiceAction(formData: FormData): Promise<void> {
  const form = readInvoiceForm(formData);
  if (!form) return;
  try {
    await apiRequest<unknown>(`/invoices/${encodeURIComponent(form.invoiceId)}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) redirect(withError(invoicePath(form.groupId, form.invoiceId), error.code));
    throw error;
  }
  revalidateInvoice(form.groupId, [form.previousExpenseId].filter(Boolean));
  redirect(`/grupos/${form.groupId}/notas`);
}
