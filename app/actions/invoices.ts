"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import type { ApiInvoice } from "@/lib/api/types";
import { failure, type FormState } from "@/lib/form";
import { INVOICE_ACCEPT, INVOICE_MAX_BYTES } from "@/lib/invoices";

const INVALID_TYPE = "Envie uma imagem JPG, PNG, WebP ou TIFF.";

export async function uploadInvoiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha a foto da nota." };
  if (file.size > INVOICE_MAX_BYTES) return { error: "O arquivo passa de 10 MB." };
  // Sem tipo no navegador (alguns TIFF) a API decide pelo conteúdo.
  if (file.type && !INVOICE_ACCEPT.includes(file.type)) return { error: INVALID_TYPE };

  const body = new FormData();
  body.set("file", file, file.name);

  let invoice: ApiInvoice;
  try {
    invoice = await apiRequest<ApiInvoice>("/invoices", { method: "POST", body });
  } catch (error) {
    // A mensagem geral cita PDF, que notas não aceitam.
    if (error instanceof ApiError && error.code === "INVALID_RECEIPT_TYPE") return { error: INVALID_TYPE };
    return failure(error);
  }
  revalidatePath("/notas");
  redirect(`/notas/${invoice.id}`);
}
