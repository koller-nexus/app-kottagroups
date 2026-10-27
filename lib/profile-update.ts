import { rateLimitMessage } from "./api/errors.ts";

// Definir, trocar ou apagar a chave Pix exige a senha atual (api#251). Editar só o nome, não.

const CURRENT_PASSWORD_REQUIRED = "CURRENT_PASSWORD_REQUIRED";
const CURRENT_PASSWORD_INVALID = "CURRENT_PASSWORD_INVALID";
const RATE_LIMITED = "RATE_LIMITED";

/** A chave salva já vem normalizada pela API; diferenças só de formato a API aceita sem senha. */
export function isPixKeyChange(typed: string, saved: string): boolean {
  return typed.trim() !== saved;
}

export interface ProfileUpdateInput {
  name: string;
  pixKey: string;
  savedPixKey: string;
  currentPassword: string;
}

export type ProfileUpdateBody =
  | { name: string }
  | { name: string; pixKey: string | null; currentPassword: string };

/** Corpo do `PATCH /users/me`: a chave e a senha só vão quando a chave muda. */
export function profileUpdateBody({ name, pixKey, savedPixKey, currentPassword }: ProfileUpdateInput): ProfileUpdateBody {
  if (!isPixKeyChange(pixKey, savedPixKey)) return { name };
  return { name, pixKey: pixKey.trim() || null, currentPassword };
}

/** Mensagem para o campo de senha; `undefined` para erros que não são da senha. */
export function passwordErrorMessage(code: string, retryAfter?: number): string | undefined {
  switch (code) {
    case CURRENT_PASSWORD_REQUIRED:
      return "Digite sua senha atual para trocar a chave Pix.";
    case CURRENT_PASSWORD_INVALID:
      return "Senha incorreta.";
    case RATE_LIMITED:
      return rateLimitMessage(retryAfter);
    default:
      return undefined;
  }
}
