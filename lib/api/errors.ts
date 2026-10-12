export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Lê `{ code, message }` ou `{ error: { code, message } }`. */
export function parseErrorBody(payload: unknown): { code: string; message: string } | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.code === "string" && typeof record.message === "string") {
    return { code: record.code, message: record.message };
  }
  const nested = record.error;
  if (nested && typeof nested === "object") {
    const error = nested as Record<string, unknown>;
    if (typeof error.code === "string" && typeof error.message === "string") {
      return { code: error.code, message: error.message };
    }
  }
  return undefined;
}

/** Mensagem em pt-BR para os códigos de erro da api-kottagroups. */
export function friendlyMessage(code: string, fallback = "Não foi possível concluir agora. Tente de novo."): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "E-mail ou senha incorretos.";
    case "EMAIL_EXISTS":
      return "Já existe uma conta com este e-mail. Entre com ela.";
    case "RATE_LIMITED":
      return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
    case "VALIDATION_FAILED":
      return "Confira os campos e tente de novo.";
    case "GROUP_ARCHIVED":
      return "Este grupo está arquivado e não aceita novas despesas.";
    case "SPLIT_SUM_MISMATCH":
      return "A soma da divisão não bate com o valor da despesa.";
    case "FORBIDDEN":
      return "Você não tem permissão para fazer isso.";
    case "NOT_FOUND":
      return "Não encontramos o que você procurava.";
    case "SERVICE_UNAVAILABLE":
    case "NETWORK_ERROR":
      return "O Kotta Groups está fora do ar no momento. Tente de novo em instantes.";
    default:
      return fallback;
  }
}
