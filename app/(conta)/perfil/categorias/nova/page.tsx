import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { CategoryForm } from "@/components/forms/category-form";

export const metadata: Metadata = {
  title: "Nova categoria — Kotta Groups",
};

export default function NovaCategoriaPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nova categoria"
        description="Ela fica disponível para todo mundo que usa a Kotta Groups."
      />
      <div className="mt-8 rounded-card border border-kotta-border bg-kotta-surface p-6 sm:p-8">
        <CategoryForm />
      </div>
    </div>
  );
}
