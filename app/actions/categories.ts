"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { apiRequest, withQuery } from "@/lib/api/server";
import type { ApiCategory } from "@/lib/api/types";
import { failure, text, type FormState } from "@/lib/form";

// O rótulo e o emoji da categoria aparecem em toda lista de despesas (grupos, Painel, detalhes):
// invalidar o app inteiro é o escopo certo, e a ação é rara.

const LABEL_MAX = 64;

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const label = text(formData, "label");
  const emoji = text(formData, "emoji");
  const values = { label, emoji };

  if (!label) return { error: "Informe um nome para a categoria.", values };
  if (label.length > LABEL_MAX) return { error: `O nome pode ter até ${LABEL_MAX} caracteres.`, values };
  if (!emoji) return { error: "Escolha um emoji.", values };

  try {
    await apiRequest<ApiCategory>(id ? `/categories/${encodeURIComponent(id)}` : "/categories", {
      method: id ? "PATCH" : "POST",
      body: { label, emoji },
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === "VALIDATION_FAILED") {
      return { error: "Dados inválidos. Use um nome curto e um único emoji.", values };
    }
    return failure(error, values);
  }
  // Categorias aparecem nos formulários de despesa e no perfil.
  revalidatePath("/", "layout");
  redirect("/perfil/categorias");
}

export interface DeleteCategoryState {
  error?: string;
  /** A API pediu uma categoria substituta para as despesas. */
  needsReplacement?: boolean;
}

export async function deleteCategoryAction(
  _prev: DeleteCategoryState,
  formData: FormData,
): Promise<DeleteCategoryState> {
  const id = text(formData, "id");
  const replacementCategoryId = text(formData, "replacementCategoryId") || undefined;
  if (!id) return { error: "Categoria não encontrada." };

  try {
    await apiRequest<void>(withQuery(`/categories/${encodeURIComponent(id)}`, { replacementCategoryId }), {
      method: "DELETE",
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.code === "CATEGORY_IN_USE") {
      return { needsReplacement: true, error: "Existe despesa usando esta categoria. Escolha uma substituta." };
    }
    if (error.code === "REPLACEMENT_CATEGORY_INVALID") {
      return { needsReplacement: true, error: friendlyMessage(error.code) };
    }
    if (error.status === 404 || error.code === "CATEGORY_NOT_FOUND") {
      revalidatePath("/perfil/categorias");
      return { error: "Esta categoria não está mais disponível." };
    }
    return { error: friendlyMessage(error.code), needsReplacement: Boolean(replacementCategoryId) };
  }
  revalidatePath("/", "layout");
  return {};
}
