import { ApiError, friendlyMessage } from "@/lib/api/errors";

export interface FormState {
  error?: string;
  ok?: boolean;
  values?: Record<string, string>;
}

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Erro da API vira mensagem no formulário; qualquer outro sobe (inclui redirect). */
export function failure(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof ApiError) return { error: friendlyMessage(error.code), values };
  throw error;
}
