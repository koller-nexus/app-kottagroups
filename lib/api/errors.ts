import { API_ERROR_DIGEST } from "../error-state.ts";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /**
   * `API_ERROR:<status>:<code>`. Em produção o Next manda ao cliente apenas o digest, e
   * respeita um digest já presente; é assim que a tela de erro escolhe a variante e a mensagem.
   */
  readonly digest: string;
  /** Segundos do cabeçalho `Retry-After`, quando a API manda. */
  readonly retryAfter?: number;

  constructor(status: number, code: string, message: string, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.digest = `${API_ERROR_DIGEST}${status}:${code}`;
    this.retryAfter = retryAfter;
  }
}

const RATE_LIMITED_MESSAGE = "Muitas tentativas seguidas. Espere um pouco e tente de novo.";

/** Mensagem de excesso de tentativas, com o tempo de espera quando a API informa. */
export function rateLimitMessage(retryAfter?: number): string {
  if (retryAfter === undefined || retryAfter <= 0) return RATE_LIMITED_MESSAGE;
  const wait = retryAfter < 60 ? `${retryAfter} s` : `${Math.ceil(retryAfter / 60)} min`;
  return `Muitas tentativas seguidas. Tente de novo em ${wait}.`;
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
      return RATE_LIMITED_MESSAGE;
    case "EMAIL_NOT_CONFIRMED":
      return "Confirme seu e-mail para continuar.";
    case "INVITE_INVALID":
      return "Este convite não vale mais. Peça um novo link a quem convidou.";
    case "INVITE_EMAIL_MISMATCH":
      return "Este convite foi enviado para outro e-mail.";
    case "INVALID_TOKEN":
      return "Este link não é mais válido. Peça um novo.";
    case "VALIDATION_FAILED":
      return "Confira os campos e tente de novo.";
    case "GROUP_ARCHIVED":
      return "Este grupo está arquivado e não aceita alterações.";
    case "SPLIT_SUM_MISMATCH":
      return "A soma da divisão não bate com o valor da despesa.";
    case "MEMBER_EXISTS":
      return "Essa pessoa já está no grupo.";
    case "OWNER_NOT_REMOVABLE":
      return "O dono do grupo não pode ser removido.";
    case "ALREADY_ADMINISTRATOR":
      return "Essa pessoa já é administradora.";
    case "CATEGORY_NAME_EXISTS":
      return "Já existe uma categoria com esse nome.";
    case "CATEGORY_DEFAULT_PROTECTED":
      return "Categorias padrão não podem ser alteradas.";
    case "CATEGORY_IN_USE":
      return "Essa categoria está em uso. Escolha outra para receber as despesas.";
    case "REPLACEMENT_CATEGORY_INVALID":
      return "Escolha uma categoria substituta válida.";
    case "RECEIPT_ALREADY_IMPORTED":
      return "Essa nota já foi usada neste grupo.";
    case "RECEIPT_RETRY_NOT_ALLOWED":
      return "Essa nota não pode ser lida de novo agora.";
    case "RECEIPT_NOT_RETRYABLE":
      return "Essa nota já foi importada neste grupo.";
    case "RECEIPT_RETRY_LIMIT":
      return "Você já usou todas as tentativas para esta nota.";
    case "EXPENSE_HAS_INVOICE":
      return "Esta despesa já tem uma nota.";
    case "NFCE_UNSUPPORTED":
      return "Ainda não lemos notas desse estado. Envie uma foto da nota.";
    case "NFCE_UNAVAILABLE":
      return "A leitura pelo QR code está fora do ar. Envie uma foto da nota.";
    case "CATEGORY_NOT_FOUND":
      return "Categoria não encontrada.";
    case "INVALID_RECEIPT_TYPE":
      return "Envie uma imagem (JPG, PNG, WebP) ou PDF.";
    case "RECEIPT_TOO_LARGE":
      return "O arquivo passa de 10 MB.";
    case "AVATAR_TOO_LARGE":
      return "A foto passa de 5 MB. Escolha uma menor.";
    case "INVALID_AVATAR_TYPE":
      return "Use uma foto JPG, PNG ou WebP.";
    case "STORAGE_UNAVAILABLE":
      return "O armazenamento de arquivos está fora do ar. Tente de novo mais tarde.";
    case "FORBIDDEN":
      return "Você não tem permissão para fazer isso.";
    case "NOT_FOUND":
      return "Não encontramos o que você procurava.";
    case "SERVICE_UNAVAILABLE":
    case "NETWORK_ERROR":
    case "INTERNAL_ERROR":
      return `O Kotta Groups está fora do ar no momento. Tente de novo em instantes. (${code})`;
    case "EDGE_BLOCKED":
      return "A conexão com o servidor do Kotta Groups foi bloqueada. Tente de novo em instantes. (EDGE_BLOCKED)";
    default:
      // O código ajuda a identificar o problema nos logs.
      return `${fallback} (${code})`;
  }
}
