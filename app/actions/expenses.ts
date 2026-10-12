"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import type { ApiExpense } from "@/lib/api/types";
import { failure, text, type FormState } from "@/lib/form";
import { parseAmountToCents } from "@/lib/kotta-view";
import { parseCustomSplit } from "@/lib/split";

const SPLIT_PREFIX = "split:";

type ExpenseBody = {
  description: string;
  amountCents: number;
  category: string;
  paidByUserId: string;
  splitType: "equal" | "custom";
  customSplit?: Record<string, number>;
};

/** Lê e valida os campos comuns de criar e editar. */
function readExpense(formData: FormData): { body: ExpenseBody; values: Record<string, string> } | FormState {
  const description = text(formData, "description");
  const amount = text(formData, "amount");
  const category = text(formData, "category");
  const paidByUserId = text(formData, "paidByUserId");
  const splitType = text(formData, "splitType") === "custom" ? "custom" : "equal";
  const values: Record<string, string> = {
    groupId: text(formData, "groupId"),
    description,
    amount,
    category,
    paidByUserId,
    splitType,
  };
  const entries: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (key.startsWith(SPLIT_PREFIX) && typeof value === "string") {
      entries[key.slice(SPLIT_PREFIX.length)] = value;
      values[key] = value;
    }
  }

  if (!description) return { error: "Descreva a despesa.", values };
  const amountCents = parseAmountToCents(amount);
  if (amountCents === null) return { error: "Informe um valor válido, como 25,90.", values };
  if (!category) return { error: "Escolha uma categoria.", values };
  if (!paidByUserId) return { error: "Diga quem pagou.", values };

  const body: ExpenseBody = { description, amountCents, category, paidByUserId, splitType };
  if (splitType === "custom") {
    const parsed = parseCustomSplit(entries, amountCents);
    if ("error" in parsed) return { error: parsed.error, values };
    body.customSplit = parsed.split;
  }
  return { body, values };
}

export async function createExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const read = readExpense(formData);
  if (!("body" in read)) return read;
  const { body, values } = read;
  const groupId = values.groupId;
  if (!groupId) return { error: "Escolha o grupo da despesa.", values };

  try {
    await apiRequest<ApiExpense>(`/groups/${encodeURIComponent(groupId)}/expenses`, { method: "POST", body });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  redirect(`/grupos/${groupId}`);
}

export async function updateExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const expenseId = text(formData, "expenseId");
  const read = readExpense(formData);
  if (!("body" in read)) return read;
  const { body, values } = read;
  if (!expenseId) return { error: "Despesa não encontrada.", values };

  try {
    await apiRequest<ApiExpense>(`/expenses/${encodeURIComponent(expenseId)}`, { method: "PATCH", body });
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  redirect(`/despesas/${expenseId}`);
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const expenseId = text(formData, "expenseId");
  const groupId = text(formData, "groupId");
  if (!expenseId) return;
  try {
    await apiRequest<unknown>(`/expenses/${encodeURIComponent(expenseId)}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) redirect(`/despesas/${expenseId}?erro=${encodeURIComponent(error.code)}`);
    throw error;
  }
  revalidatePath("/", "layout");
  redirect(groupId ? `/grupos/${groupId}` : "/grupos");
}
