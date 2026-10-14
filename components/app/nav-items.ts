export const navItems = [
  { href: "/", label: "Painel", icon: "home" },
  { href: "/grupos", label: "Grupos", icon: "groups" },
  { href: "/perfil", label: "Perfil", icon: "user" },
] as const;

export type NavIcon = (typeof navItems)[number]["icon"];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
