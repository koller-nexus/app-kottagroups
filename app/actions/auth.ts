"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, friendlyMessage, rateLimitMessage } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import { clearSessionToken, getSessionToken, setSessionToken } from "@/lib/api/session";
import type { ApiUser } from "@/lib/api/types";
import { fieldErrorFromApi, hasErrors, validateLogin, validateRegistration, type FieldErrors } from "@/lib/auth-validation";
import { confirmationOutcome, isUsableConfirmationToken, type ConfirmationOutcome } from "@/lib/confirm-email";
import { failure, type FormState } from "@/lib/form";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { safeNextPath } from "@/lib/safe-next";
import { isSessionExpired } from "@/lib/session-expiry";
import { accountCreatedLoginUrl, confirmEmailUrl } from "@/lib/session-flow";

export interface AuthFormState {
  /** Erro geral, no topo do formulário. */
  error?: string;
  fieldErrors?: FieldErrors;
  fields?: { name?: string; email?: string; pixKey?: string; acceptTerms?: boolean };
}

/** A API limita o reenvio do link de confirmação a 1 a cada 60 s. */
const RESEND_INTERVAL_SECONDS = 60;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function rawText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Navegador de quem está entrando ou se cadastrando. A chamada à API sai deste servidor, então sem
 * isto a API registraria o agente do servidor na sessão e no aceite dos termos.
 */
async function browserHeaders(): Promise<HeadersInit> {
  const userAgent = (await headers()).get("user-agent");
  return userAgent ? { "User-Agent": userAgent } : {};
}

async function signIn(email: string, password: string): Promise<ApiUser> {
  // `token` é o campo legado; a API com renovação de sessão manda `accessToken`.
  const result = await apiRequest<{ user: ApiUser; accessToken?: string; token?: string }>("/auth/login", {
    method: "POST",
    auth: false,
    headers: await browserHeaders(),
    body: { email, password },
  });
  const token = result.accessToken ?? result.token;
  if (!token) throw new ApiError(502, "INVALID_LOGIN_RESPONSE", "Login response without a token");
  await setSessionToken(token);
  return result.user;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email");
  const password = rawText(formData, "password");
  const next = safeNextPath(formData.get("next"));

  const fieldErrors = validateLogin({ email, password });
  if (hasErrors(fieldErrors)) return { fieldErrors, fields: { email } };

  let user: ApiUser;
  try {
    user = await signIn(email, password);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    const message = error.code === "RATE_LIMITED" ? rateLimitMessage(error.retryAfter) : friendlyMessage(error.code);
    return { error: message, fields: { email } };
  }

  redirect(user.emailConfirmed ? next : confirmEmailUrl(next));
}

/** Erro da API no cadastro → campo, quando dá para saber qual; senão, erro geral. */
function registerFailure(error: ApiError, fields: AuthFormState["fields"]): AuthFormState {
  if (error.code === "EMAIL_EXISTS") {
    return { fieldErrors: { email: "Já existe uma conta com este e-mail." }, fields };
  }
  const mapped = error.code === "VALIDATION_FAILED" ? fieldErrorFromApi(error.message) : undefined;
  if (mapped) return { fieldErrors: { [mapped.field]: mapped.message }, fields };
  return { error: friendlyMessage(error.code), fields };
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const pixKey = text(formData, "pixKey");
  const password = rawText(formData, "password");
  const acceptTerms = formData.get("acceptTerms") === "on";
  const fields = { name, email, pixKey, acceptTerms };

  const fieldErrors = validateRegistration({ name, email, password, pixKey, acceptTerms });
  if (hasErrors(fieldErrors)) return { fieldErrors, fields };

  try {
    // A API guarda as versões aceitas, a data/hora, o IP e o navegador como prova do aceite (LGPD).
    await apiRequest<{ user: ApiUser }>("/auth/register", {
      method: "POST",
      auth: false,
      headers: await browserHeaders(),
      body: {
        name,
        email,
        password,
        ...(pixKey ? { pixKey } : {}),
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
      },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return registerFailure(error, fields);
  }

  // O cadastro não devolve token: entra em seguida com a mesma senha. Se isso falhar, a conta já
  // existe; mandar ao login evita que um novo envio dê "e-mail já cadastrado".
  let signedIn = true;
  try {
    await signIn(email, password);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    signedIn = false;
  }
  redirect(signedIn ? "/confirme-seu-email" : accountCreatedLoginUrl(email));
}

/** Logout por formulário. `destino=cadastrar` serve para corrigir um e-mail digitado errado. */
export async function logoutAction(formData?: FormData): Promise<void> {
  await clearSessionToken();
  redirect(formData?.get("destino") === "cadastrar" ? "/cadastrar" : "/entrar?motivo=saiu");
}

export interface ResendState {
  status: "idle" | "sent" | "error";
  message?: string;
  /** Segundos até poder pedir outro link. */
  retryAfter?: number;
}

export async function resendConfirmationAction(): Promise<ResendState> {
  try {
    const user = await apiRequest<ApiUser>("/auth/resend-confirmation", { method: "POST" });
    if (user?.emailConfirmed) redirect("/");
    return { status: "sent", message: "Enviamos um novo link para o seu e-mail.", retryAfter: RESEND_INTERVAL_SECONDS };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.code === "RATE_LIMITED") {
      return {
        status: "error",
        message: "Você acabou de pedir um link. Aguarde para pedir outro.",
        retryAfter: error.retryAfter ?? RESEND_INTERVAL_SECONDS,
      };
    }
    return { status: "error", message: friendlyMessage(error.code) };
  }
}

export interface ConfirmationCheckState {
  message?: string;
}

/** "Já confirmei": segue se a conta está confirmada, senão avisa na mesma tela. */
export async function checkConfirmationAction(
  _prev: ConfirmationCheckState,
  formData: FormData,
): Promise<ConfirmationCheckState> {
  const next = safeNextPath(formData.get("next"));
  let user: ApiUser;
  try {
    user = await apiRequest<ApiUser>("/users/me");
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { message: friendlyMessage(error.code) };
  }
  if (user.emailConfirmed) redirect(next);
  return { message: "Ainda não recebemos a confirmação. Abra o link no seu e-mail." };
}

/** Conta logada, se houver sessão não vencida; nunca redireciona por falta de sessão. */
async function signedInUser(): Promise<ApiUser | undefined> {
  const token = await getSessionToken();
  if (isSessionExpired(token)) return undefined;
  try {
    return await apiRequest<ApiUser>("/users/me");
  } catch (error) {
    if (error instanceof ApiError) return undefined;
    throw error;
  }
}

/** Confirma o e-mail do link. O token nunca é registrado nem devolvido. */
export async function confirmEmailAction(token: string): Promise<ConfirmationOutcome> {
  if (!isUsableConfirmationToken(token)) {
    return confirmationOutcome({ token, status: 0, sessionUser: await signedInUser() });
  }

  let status = 200;
  try {
    await apiRequest("/auth/confirm-email", { method: "POST", auth: false, body: { token: token.trim() } });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    status = error.code === "NETWORK_ERROR" ? 0 : error.status;
  }

  const sessionUser = await signedInUser();
  const outcome = confirmationOutcome({ token, status, sessionUser });
  // O layout logado lê emailConfirmed; revalidar tira o aviso de "confirme seu e-mail".
  // E-mail confirmado muda o que o shell mostra; invalida o app inteiro.
  if (outcome.state === "success" && outcome.signedIn) revalidatePath("/", "layout");
  return outcome;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email");
  const values = { email };
  if (!EMAIL_PATTERN.test(email)) return { error: "Informe um e-mail válido.", values };

  try {
    // A API responde ok mesmo sem conta, para não revelar quem está cadastrado.
    await apiRequest<{ ok: boolean }>("/users/forget-password", {
      method: "POST",
      auth: false,
      body: { email },
    });
  } catch (error) {
    return failure(error, values);
  }
  return { ok: true, values };
}
