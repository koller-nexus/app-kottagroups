export type ConfirmationState =
  | "success"
  | "invalid"
  | "unexpected-error";

export type ConfirmationResult = {
  state: ConfirmationState;
  message?: string;
  expired?: boolean;
};

const fallbackErrorMessage = "Não foi possível confirmar seu e-mail agora.";

export function isUsableConfirmationToken(token: string | null): token is string {
  return typeof token === "string" && token.trim().length > 0;
}

export function getConfirmationState(
  status: number,
): ConfirmationState {
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

export function isExpiredConfirmationError(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }

  const record = body as Record<string, unknown>;
  const error = record.error;
  const code =
    error && typeof error === "object"
      ? (error as Record<string, unknown>).code
      : record.code;
  const message = readMessage(body)?.toLocaleLowerCase("pt-BR");

  return (
    code === "TOKEN_EXPIRED" ||
    message?.includes("expirou") === true ||
    message?.includes("expired") === true
  );
}

export function getConfirmationErrorMessage(
  body: unknown,
  token?: string,
): string {
  const message = readMessage(body) ?? fallbackErrorMessage;
  return token ? message.replaceAll(token, "[oculto]") : message;
}

export async function confirmEmail(
  token: string,
  signal?: AbortSignal,
): Promise<ConfirmationResult> {
  const response = await fetch("/api/v1/auth/confirm-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const state = getConfirmationState(response.status);
  return state === "success"
    ? { state }
    : {
        state,
        message: getConfirmationErrorMessage(body, token),
        expired: isExpiredConfirmationError(body),
      };
}
