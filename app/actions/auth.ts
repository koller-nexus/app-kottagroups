"use server";

import { redirect } from "next/navigation";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import { clearSessionToken, setSessionToken } from "@/lib/api/session";
import type { ApiUser } from "@/lib/api/types";
import { failure, type FormState } from "@/lib/form";
import { safeNextPath } from "@/lib/safe-next";

export interface AuthFormState {
  error?: string;
  fields?: { name?: string; email?: string; pixKey?: string };
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function signIn(email: string, password: string): Promise<ApiUser> {
  const result = await apiRequest<{ user: ApiUser; token: string }>("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  await setSessionToken(result.token);
  return result.user;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email");
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Informe seu e-mail e sua senha.", fields: { email } };
  }

  let user: ApiUser;
  try {
    user = await signIn(email, password);
  } catch (error) {
    const code = error instanceof ApiError ? error.code : "UNKNOWN_ERROR";
    return { error: friendlyMessage(code), fields: { email } };
  }

  redirect(user.emailConfirmed ? next : "/confirme-seu-email");
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const pixKey = text(formData, "pixKey");
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const fields = { name, email, pixKey };

  if (!name || !email) {
    return { error: "Preencha seu nome e seu e-mail.", fields };
  }
  if (password.length < 8 || password.length > 72) {
    return { error: "A senha precisa ter de 8 a 72 caracteres.", fields };
  }

  try {
    await apiRequest<{ user: ApiUser }>("/auth/register", {
      method: "POST",
      auth: false,
      body: { name, email, password, ...(pixKey ? { pixKey } : {}) },
    });
    // O cadastro não devolve token: entra em seguida com a mesma senha.
    await signIn(email, password);
  } catch (error) {
    const code = error instanceof ApiError ? error.code : "UNKNOWN_ERROR";
    return { error: friendlyMessage(code), fields };
  }

  redirect("/confirme-seu-email");
}

export async function logoutAction(): Promise<void> {
  await clearSessionToken();
  redirect("/entrar");
}

export interface ResendState {
  status: "idle" | "sent" | "error";
  message?: string;
}

export async function resendConfirmationAction(): Promise<ResendState> {
  try {
    const user = await apiRequest<ApiUser>("/auth/resend-confirmation", { method: "POST" });
    if (user?.emailConfirmed) redirect("/");
    return { status: "sent", message: "Enviamos um novo link para o seu e-mail." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", message: friendlyMessage(error.code) };
    }
    throw error;
  }
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
