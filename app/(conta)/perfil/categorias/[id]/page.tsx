import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { CategoryForm } from "@/components/forms/category-form";
import { listCategories } from "@/lib/api/kotta";

export const metadata: Metadata = {
  title: "Editar categoria — Kotta Groups",
};

export default async function EditarCategoriaPage({ params }: PageProps<"/perfil/categorias/[id]">) {
  const { id } = await params;
  const category = (await listCategories()).find((item) => item.id === id);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Editar categoria"
        description="A mudança vale para todo mundo que usa a Kotta Groups."
      />
      <div className="mt-8 rounded-card border border-kotta-border bg-kotta-surface p-6 sm:p-8">
        {category.isDefault ? (
          <>
            <p className="rounded-control bg-kotta-danger-bg p-4 text-sm text-kotta-danger">
              Categorias padrão não podem ser alteradas.
            </p>
            <Link href="/perfil/categorias" className="secondary-action mt-6">
              Voltar às categorias
            </Link>
          </>
        ) : (
          <CategoryForm category={{ id: category.id, label: category.label, emoji: category.emoji }} />
        )}
      </div>
    </div>
  );
}
