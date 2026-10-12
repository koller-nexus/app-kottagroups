import { Price } from "@/components/app/price";
import type { CategoryView } from "@/lib/categories";

interface CategoryBarsProps {
  totals: { slug: string; cents: number }[];
  category: (slug: string) => CategoryView;
}

/** "Por categoria": barras horizontais relativas à maior categoria. */
export function CategoryBars({ totals, category }: CategoryBarsProps) {
  const max = Math.max(0, ...totals.map((t) => t.cents));
  return (
    <ul className="flex flex-col gap-3 rounded-card border border-kotta-border bg-kotta-surface p-5">
      {totals.map(({ slug, cents }) => {
        const cat = category(slug);
        return (
          <li key={slug} className="flex items-center gap-3">
            <span aria-hidden="true" className="w-6 text-center text-lg">
              {cat.emoji}
            </span>
            <span className="sr-only">{cat.label}</span>
            <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-kotta-border">
              <span
                className="block h-full rounded-full bg-kotta-primary"
                style={{ width: `${max > 0 ? (cents / max) * 100 : 0}%` }}
              />
            </span>
            <Price cents={cents} size={15} className="w-24 shrink-0 text-right text-kotta-text" />
          </li>
        );
      })}
    </ul>
  );
}
