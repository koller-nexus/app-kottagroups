import type { ApiCategory } from "@/lib/api/types";

export interface CategoryView {
  label: string;
  emoji: string;
}

// Rótulos de reserva para os slugs padrão da API, caso /categories falhe.
const DEFAULTS: Record<string, CategoryView> = {
  comida: { label: "Comida", emoji: "🍽️" },
  transporte: { label: "Transporte", emoji: "🚗" },
  moradia: { label: "Moradia", emoji: "🏠" },
  lazer: { label: "Lazer", emoji: "🎟️" },
  compras: { label: "Compras", emoji: "🛒" },
  outros: { label: "Outros", emoji: "🧾" },
};

export function categoryLookup(categories: ApiCategory[]): (slug: string) => CategoryView {
  const bySlug = new Map(categories.map((c) => [c.slug, { label: c.label, emoji: c.emoji }]));
  return (slug) => bySlug.get(slug) ?? DEFAULTS[slug] ?? { label: slug, emoji: "🧾" };
}
