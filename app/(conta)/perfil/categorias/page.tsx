import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, PlusIcon } from "@/components/app/icons";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import { DeleteCategoryButton } from "@/components/forms/delete-category-button";
import { listCategories } from "@/lib/api/kotta";

export const metadata: Metadata = {
  title: "Categorias — Kotta Groups",
};

function EmojiTile({ emoji }: { emoji: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-11 shrink-0 items-center justify-center rounded-control bg-kotta-light-green text-2xl"
    >
      {emoji}
    </span>
  );
}

export default async function CategoriasPage() {
  const categories = await listCategories();
  const defaults = categories.filter((category) => category.isDefault);
  const custom = categories.filter((category) => !category.isDefault);
  const replacementsFor = (id: string) =>
    categories
      .filter((category) => category.id !== id)
      .map(({ id: optionId, label, emoji }) => ({ id: optionId, label, emoji }));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/perfil"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
      >
        <ArrowLeftIcon className="size-4" />
        Perfil
      </Link>
      <PageHeader
        title="Categorias"
        description="Organize suas despesas do seu jeito. As categorias valem para todo mundo que usa a Kotta Groups."
        actions={
          <Link href="/perfil/categorias/nova" className="primary-action">
            <PlusIcon className="size-5" />
            Nova categoria
          </Link>
        }
      />

      <section aria-labelledby="personalizadas" className="mt-8">
        <SectionLabel id="personalizadas">Personalizadas</SectionLabel>
        {custom.length === 0 ? (
          <p className="rounded-card border border-dashed border-kotta-border bg-kotta-surface p-8 text-center text-sm text-kotta-muted">
            Nenhuma categoria personalizada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {custom.map((category) => (
              <li key={category.id} className="flex min-h-[68px] flex-wrap items-center gap-3 py-3">
                <EmojiTile emoji={category.emoji} />
                <span className="min-w-0 flex-1 truncate text-base font-semibold text-kotta-text">
                  {category.label}
                </span>
                <Link
                  href={`/perfil/categorias/${category.id}`}
                  aria-label={`Editar ${category.label}`}
                  className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-kotta-primary hover:bg-kotta-light-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                >
                  Editar
                </Link>
                <DeleteCategoryButton
                  id={category.id}
                  label={category.label}
                  replacements={replacementsFor(category.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="padrao" className="mt-8">
        <SectionLabel id="padrao">Padrão</SectionLabel>
        <p className="mb-3 text-sm text-kotta-muted">Categorias padrão não podem ser alteradas.</p>
        <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
          {defaults.map((category) => (
            <li key={category.id} className="flex min-h-[68px] items-center gap-3 py-3">
              <EmojiTile emoji={category.emoji} />
              <span className="min-w-0 flex-1 truncate text-base font-semibold text-kotta-text">
                {category.label}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
