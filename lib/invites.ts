import { EMAIL_PATTERN } from "./auth-validation.ts";
import type { ApiGroupInvite, ApiInviteStatus } from "./api/types.ts";

// Limites da API de convites (api-kottagroups spec 071).
export const INVITE_MAX_USES_MIN = 1;
export const INVITE_MAX_USES_MAX = 100;
export const INVITE_DEFAULT_EXPIRY_HOURS = 168;
export const INVITE_EXPIRY_OPTIONS = [
  { hours: 1, label: "1 hora" },
  { hours: 24, label: "1 dia" },
  { hours: INVITE_DEFAULT_EXPIRY_HOURS, label: "7 dias" },
  { hours: 720, label: "30 dias" },
] as const;
export const INVITE_LIST_LIMIT = 50;
// A API gera 43 caracteres base64url; aqui só barramos lixo óbvio, ela decide o resto.
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;

const INVALID_CODES = new Set(["INVITE_INVALID", "VALIDATION_FAILED", "NOT_FOUND"]);
const EMAIL_MISMATCH = "INVITE_EMAIL_MISMATCH";

const STATUS_LABEL: Record<ApiInviteStatus, string> = {
  active: "Pendente",
  exhausted: "Usado",
  expired: "Expirado",
  revoked: "Revogado",
};

export function isInviteTokenShape(token: unknown): token is string {
  return typeof token === "string" && INVITE_TOKEN_PATTERN.test(token);
}

/** Caminho da página do convite, para o `next` do cadastro e do login. */
export function inviteReturnPath(token: string): string {
  return `/convite/${encodeURIComponent(token)}`;
}

/** Tira o segredo da URL antes de mandar para analytics. */
export function redactInviteUrl(url: string): string {
  return url.replace(/\/convite\/.*/, "/convite/[token]");
}

/** "24 de out., 14:30" no horário de Brasília. */
export function formatInviteDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export interface InviteFormInput {
  email: string | null;
  maxUses: number;
  expiresInHours: number;
}

export type InviteFormErrors = Partial<Record<keyof InviteFormInput, string>>;

/**
 * Valida o formulário do modal. `audience` "many" libera `maxUses`; com e-mail o convite é
 * sempre de uso único (regra da API).
 */
export function parseInviteForm(values: Record<string, string | undefined>): {
  input: InviteFormInput;
  errors: InviteFormErrors;
} {
  const errors: InviteFormErrors = {};
  const email = (values.email ?? "").trim() || null;
  if (email && !EMAIL_PATTERN.test(email)) errors.email = "Informe um e-mail válido.";

  let maxUses = INVITE_MAX_USES_MIN;
  if (!email && values.audience === "many") {
    maxUses = Number(values.maxUses);
    const inRange = Number.isInteger(maxUses) && maxUses >= INVITE_MAX_USES_MIN && maxUses <= INVITE_MAX_USES_MAX;
    if (!inRange) errors.maxUses = `Escolha de ${INVITE_MAX_USES_MIN} a ${INVITE_MAX_USES_MAX} pessoas.`;
  }

  const rawHours = values.expiresInHours?.trim();
  const expiresInHours = rawHours ? Number(rawHours) : INVITE_DEFAULT_EXPIRY_HOURS;
  if (!INVITE_EXPIRY_OPTIONS.some((option) => option.hours === expiresInHours)) {
    errors.expiresInHours = "Escolha uma validade da lista.";
  }

  return { input: { email, maxUses, expiresInHours }, errors };
}

export type InvitePageState = "invalid" | "guest" | "member-ready" | "email-mismatch" | "error";

/** Estado da página `/convite/[token]` a partir da prévia, da sessão e do `?erro=`. */
export function invitePageState({
  tokenOk,
  previewErrorCode,
  hasSession,
  erro,
}: {
  tokenOk: boolean;
  previewErrorCode?: string;
  hasSession: boolean;
  erro?: string;
}): InvitePageState {
  if (!tokenOk) return "invalid";
  if (previewErrorCode && INVALID_CODES.has(previewErrorCode)) return "invalid";
  if (erro && INVALID_CODES.has(erro)) return "invalid";
  if (previewErrorCode) return "error";
  if (!hasSession) return "guest";
  return erro === EMAIL_MISMATCH ? "email-mismatch" : "member-ready";
}

export interface InviteRow {
  id: string;
  /** E-mail convidado ou "Link". */
  target: string;
  creatorName: string;
  uses: number;
  maxUses: number;
  expiresAt: string;
  createdAt: string;
  statusLabel: string;
}

/** Pendentes (ainda valem) e encerrados, na ordem da API (mais recentes primeiro). */
export function splitInvites(
  invites: ApiGroupInvite[],
  nameById: ReadonlyMap<string, string>,
): { pending: InviteRow[]; closed: InviteRow[] } {
  const pending: InviteRow[] = [];
  const closed: InviteRow[] = [];
  for (const invite of invites) {
    const row: InviteRow = {
      id: invite.id,
      target: invite.email ?? "Link",
      creatorName: nameById.get(invite.createdBy) ?? "Ex-membro",
      uses: invite.uses,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      statusLabel: STATUS_LABEL[invite.status],
    };
    (invite.status === "active" ? pending : closed).push(row);
  }
  return { pending, closed };
}

/** Um quadrado por módulo escuro da matriz do QR, num único `path`. */
export function qrSvgPath(matrix: boolean[][]): string {
  let path = "";
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) path += `M${x} ${y}h1v1h-1z`;
    });
  });
  return path;
}
