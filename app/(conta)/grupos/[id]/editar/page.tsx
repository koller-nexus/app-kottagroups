import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { NewGroupForm } from "@/components/forms/new-group-form";
import { ApiError } from "@/lib/api/errors";
import { getGroup, getMe } from "@/lib/api/kotta";
import { canManageGroup } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Editar grupo — Kotta Groups",
};

export default async function EditarGrupoPage({ params }: PageProps<"/grupos/[id]/editar">) {
  const { id } = await params;
  const [me, group] = await Promise.all([
    getMe(),
    getGroup(id).catch((error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
      throw error;
    }),
  ]);
  // Só o dono renomeia ou troca o ícone.
  if (!canManageGroup(group.members.find((m) => m.id === me.id)?.role)) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar grupo" description="Mude o nome ou o ícone. Todos os membros veem a mudança." />
      <div className="mt-8 rounded-card border border-kotta-border bg-kotta-surface p-6 sm:p-8">
        <NewGroupForm group={{ id: group.id, name: group.name, emoji: group.emoji }} />
      </div>
    </div>
  );
}
