import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { NewGroupForm } from "@/components/forms/new-group-form";

export const metadata: Metadata = {
  title: "Novo grupo — Kotta Groups",
};

export default function NovoGrupoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Novo grupo" description="Você entra como dono e pode convidar pessoas depois." />
      <div className="mt-8 rounded-card border border-kotta-border bg-kotta-surface p-6 sm:p-8">
        <NewGroupForm />
      </div>
    </div>
  );
}
