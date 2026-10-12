import type { ApiGroupDetail } from "@/lib/api/types";

/** Nome de cada pessoa que aparece nos grupos do usuário. */
export function peopleById(groups: ApiGroupDetail[]): Map<string, string> {
  const names = new Map<string, string>();
  for (const group of groups) {
    for (const member of group.members) names.set(member.id, member.name);
  }
  return names;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** "Você" para o próprio usuário; primeiro nome para os demais. */
export function displayName(
  names: Map<string, string>,
  userId: string,
  meId: string,
  { object = false } = {},
): string {
  if (userId === meId) return object ? "você" : "Você";
  const name = names.get(userId);
  return name ? firstName(name) : "Ex-membro";
}
