import type { ApiMemberRole } from "@/lib/api/types";

// Espelha as regras de api-kottagroups (service/group.go, service/expense.go).

/** Renomear, arquivar, adicionar e remover membros: só o dono. */
export function canManageGroup(role: ApiMemberRole | undefined): boolean {
  return role === "owner";
}

/** Excluir o grupo e promover membros: dono ou admin. */
export function canDeleteGroup(role: ApiMemberRole | undefined): boolean {
  return role === "owner" || role === "admin";
}

export const canPromoteMember = canDeleteGroup;

/** Editar ou excluir despesa: quem criou ou o dono do grupo. */
export function canEditExpense(meId: string, createdByUserId: string, role: ApiMemberRole | undefined): boolean {
  return meId === createdByUserId || role === "owner";
}

/** Marcar ou desfazer pagamento: só quem paga ou quem recebe. */
export function canSettle(meId: string, settlement: { from: string; to: string }): boolean {
  return meId === settlement.from || meId === settlement.to;
}
