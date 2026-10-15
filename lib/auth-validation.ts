export type AuthField = "name" | "email" | "password" | "pixKey" | "acceptTerms";
export type FieldErrors = Partial<Record<AuthField, string>>;

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  pixKey: string;
  acceptTerms: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PASSWORD_MIN_CHARS = 8;
// A API mede o máximo em bytes (limite do bcrypt), não em caracteres.
const PASSWORD_MAX_BYTES = 72;
const PIX_KEY_MAX_CHARS = 140;

const MESSAGES = {
  name: "Informe seu nome.",
  email: "Informe um e-mail válido.",
  password: "A senha precisa ter de 8 a 72 caracteres.",
  passwordMissing: "Informe sua senha.",
  pixKey: "Use CPF, CNPJ, e-mail, celular ou chave aleatória.",
  pixKeyTooLong: "A chave Pix pode ter até 140 caracteres.",
  pixKeyInvalid: "Essa chave Pix não é válida. Confira CPF, CNPJ, e-mail, celular ou chave aleatória.",
  acceptTerms: "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.",
} as const;

/** Ordem dos campos na tela, para focar o primeiro erro. */
export const FIELD_ORDER: AuthField[] = ["name", "email", "password", "pixKey", "acceptTerms"];

export function isPasswordLengthOk(password: string): boolean {
  return password.length >= PASSWORD_MIN_CHARS && new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES;
}

/** Só o formato; dígito verificador de CPF/CNPJ fica com a API. */
function isPixKeyShapeOk(pixKey: string): boolean {
  if (EMAIL_PATTERN.test(pixKey) || UUID_PATTERN.test(pixKey)) return true;
  if (/[a-z]/i.test(pixKey)) return false;
  // Celular tem 10–13 dígitos (com ou sem +55), CPF 11 e CNPJ 14.
  const digits = pixKey.replace(/\D/g, "").length;
  return digits >= 10 && digits <= 14;
}

export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name.trim()) errors.name = MESSAGES.name;
  if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = MESSAGES.email;
  if (!isPasswordLengthOk(input.password)) errors.password = MESSAGES.password;
  const pixKey = input.pixKey.trim();
  if (pixKey.length > PIX_KEY_MAX_CHARS) errors.pixKey = MESSAGES.pixKeyTooLong;
  else if (pixKey && !isPixKeyShapeOk(pixKey)) errors.pixKey = MESSAGES.pixKey;
  if (!input.acceptTerms) errors.acceptTerms = MESSAGES.acceptTerms;
  return errors;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = MESSAGES.email;
  if (!input.password) errors.password = MESSAGES.passwordMissing;
  return errors;
}

export function hasErrors(errors: FieldErrors | undefined): errors is FieldErrors {
  return errors !== undefined && Object.keys(errors).length > 0;
}

export function firstErrorField(errors: FieldErrors | undefined): AuthField | undefined {
  return FIELD_ORDER.find((field) => errors?.[field]);
}

/** Mensagem de VALIDATION_FAILED da API → campo e texto em pt-BR. */
export function fieldErrorFromApi(message: string): { field: AuthField; message: string } | undefined {
  if (message.startsWith("Pix key is too long")) return { field: "pixKey", message: MESSAGES.pixKeyTooLong };
  if (message.startsWith("Pix key")) return { field: "pixKey", message: MESSAGES.pixKeyInvalid };
  if (message.startsWith("Name")) return { field: "name", message: MESSAGES.name };
  if (message.startsWith("Email")) return { field: "email", message: MESSAGES.email };
  if (message.startsWith("Password")) return { field: "password", message: MESSAGES.password };
  return undefined;
}
