import type { Metadata } from "next";
import { Page } from "@/components/app/page-header";
import { CategoryForm } from "@/components/forms/category-form";

export const metadata: Metadata = {
  title: "Nova categoria — Kotta Groups",
};

export default function NovaCategoriaPage() {
  return (
    <Page
      width="reading"
      title="Nova categoria"
      description="Ela fica disponível para todo mundo que usa a Kotta Groups."
    >
      <div className="rounded-card border border-kotta-border bg-kotta-surface p-6 sm:p-8">
        <CategoryForm />
      </div>
    </Page>
  );
}
