"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, friendlyMessage, rateLimitMessage } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";
import type { ApiGroupInviteCreated, ApiInviteAccepted } from "@/lib/api/types";
import { text } from "@/lib/form";
import { inviteReturnPath, isInviteTokenShape, parseInviteForm, type InviteFormErrors } from "@/lib/invites";

const invitesPath = (groupId: string) => `/groups/${encodeURIComponent(groupId)}/invites`;
const membersPage = (groupId: string) => `/grupos/${groupId}/membros`;

export interface CreatedInvite {
  url: string;
  email: string | null;
  emailSent: boolean;
  maxUses: number;
  expiresAt: string;
}

export interface InviteFormState {
  created?: CreatedInvite;
  error?: string;
  fieldErrors?: InviteFormErrors;
  values?: Record<string, string>;
}

function apiMessage(error: ApiError): string {
  return error.code === "RATE_LIMITED" ? rateLimitMessage(error.retryAfter) : friendlyMessage(error.code);
}

export async function createInviteAction(_prev: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const groupId = text(formData, "groupId");
  const values = {
    email: text(formData, "email"),
    audience: text(formData, "audience"),
    maxUses: text(formData, "maxUses"),
    expiresInHours: text(formData, "expiresInHours"),
  };
  if (!groupId) return { error: "Grupo não encontrado.", values };

  const { input, errors } = parseInviteForm(values);
  if (Object.keys(errors).length > 0) return { fieldErrors: errors, values };

  let created: ApiGroupInviteCreated;
  try {
    created = await apiRequest<ApiGroupInviteCreated>(invitesPath(groupId), {
      method: "POST",
      body: { ...(input.email ? { email: input.email } : {}), maxUses: input.maxUses, expiresInHours: input.expiresInHours },
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: apiMessage(error), values };
    throw error;
  }

  revalidatePath(membersPage(groupId));
  // Só o necessário para a tela; o token já está dentro da url.
  const { invite, url, emailSent } = created;
  return { created: { url, email: invite.email, emailSent, maxUses: invite.maxUses, expiresAt: invite.expiresAt } };
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const groupId = text(formData, "groupId");
  const inviteId = text(formData, "inviteId");
  if (!groupId || !inviteId) return;
  try {
    await apiRequest<void>(`${invitesPath(groupId)}/${encodeURIComponent(inviteId)}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) redirect(`${membersPage(groupId)}?erro=${encodeURIComponent(error.code)}`);
    throw error;
  }
  revalidatePath(membersPage(groupId));
  redirect(`${membersPage(groupId)}?aviso=convite-revogado`);
}

export async function acceptInviteAction(formData: FormData): Promise<void> {
  const token = text(formData, "token");
  const back = inviteReturnPath(token);
  if (!isInviteTokenShape(token)) redirect(`${back}?erro=INVITE_INVALID`);

  let accepted: ApiInviteAccepted;
  try {
    // Sessão expirada e e-mail não confirmado já redirecionam dentro do apiRequest, voltando aqui.
    accepted = await apiRequest<ApiInviteAccepted>("/invites/accept", { method: "POST", body: { token } });
  } catch (error) {
    if (error instanceof ApiError) redirect(`${back}?erro=${encodeURIComponent(error.code)}`);
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/grupos/${accepted.groupId}?aviso=${accepted.joined ? "entrou" : "ja-membro"}`);
}
