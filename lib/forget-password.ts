export type RecoveryState = "success" | "invalid" | "unexpected-error";

export type RecoveryResult = {
  state: RecoveryState;
  message?: string;
};

export const minPasswordBytes = 8;
export const maxPasswordBytes = 72;

const fallbackErrorMessage = "Não foi possível redefinir sua senha agora.";

const apiMessageMap: Record<string, string> = {
  "Token is required": "Este link de recuperação não tem um token válido.",
  "Password must be at least 8 characters":
    "A senha precisa ter pelo menos 8 caracteres.",
  "Password must be at most 72 bytes":
    "A senha precisa ter no máximo 72 caracteres.",
  "Recovery is invalid or expired":
    "Este link é inválido, expirou ou já foi utilizado.",
};

export function isUsableResetToken(token: string | null): token is string {
  return typeof token === "string" && token.trim().length > 0;
}

export function passwordByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

export function getPasswordValidationMessage(
  password: string,
  confirmation: string,
): string | undefined {
  const bytes = passwordByteLength(password);
  if (bytes < minPasswordBytes) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  if (bytes > maxPasswordBytes) {
    return "A senha precisa ter no máximo 72 caracteres.";
  }
  if (password !== confirmation) {
    return "As senhas não coincidem.";
  }
  return undefined;
}

export function getRecoveryState(status: number): RecoveryState {
  if (status >= 200 && status < 300) {
    return "success";
  }

  if (status >= 400 && status < 500) {
    return "invalid";
  }

  return "unexpected-error";
}

function readMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const error = record.error;

  if (typeof record.message === "string") {
    return record.message;
  }

  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;
    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }
    if (typeof errorRecord.detail === "string") {
      return errorRecord.detail;
    }
  }

  return undefined;
}

export function getRecoveryErrorMessage(
  body: unknown,
  token?: string,
): string {
  const raw = readMessage(body);
  const mapped = raw ? (apiMessageMap[raw] ?? raw) : fallbackErrorMessage;
  return token ? mapped.replaceAll(token, "[oculto]") : mapped;
}

export async function recoverPassword(
  token: string,
  password: string,
  signal?: AbortSignal,
): Promise<RecoveryResult> {
  const response = await fetch("/api/v1/users/recovery-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
    cache: "no-store",
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const state = getRecoveryState(response.status);
  return state === "success"
    ? { state }
    : {
        state,
        message: getRecoveryErrorMessage(body, token),
      };
}
