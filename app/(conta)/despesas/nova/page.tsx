import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { NewExpenseForm } from "@/components/forms/new-expense-form";
import { getMe, listCategories, listGroupDetails } from "@/lib/api/kotta";

export const metadata: Metadata = {
  title: "Nova despesa — Kotta Groups",
};

export default async function NovaDespesaPage({ searchParams }: PageProps<"/despesas/nova">) {
  const { grupo } = await searchParams;
  const [me, groups, categories] = await Promise.all([getMe(), listGroupDetails(), listCategories()]);
  const open = groups.filter((g) => !g.archived);
  const requested = typeof grupo === "string" ? grupo : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nova despesa" description="Lance o gasto e o Kotta Groups divide entre o grupo." />
      <div className="mt-8 rounded-card border border-kotta-border bg-kotta-surface p-6 sm:p-8">
        {open.length === 0 ? (
          <div className="text-center">
            <p className="text-sm text-kotta-muted">Você precisa de um grupo para lançar despesas.</p>
            <Link href="/grupos/novo" className="primary-action mt-5">
              Criar grupo
            </Link>
          </div>
        ) : (
          <NewExpenseForm
            groups={open.map(({ id, name, emoji, members }) => ({
              id,
              name,
              emoji,
              members: members.map(({ id: memberId, name: memberName }) => ({ id: memberId, name: memberName })),
            }))}
            categories={categories.map(({ slug, label, emoji }) => ({ slug, label, emoji }))}
            meId={me.id}
            defaultGroupId={open.some((g) => g.id === requested) ? requested : undefined}
          />
        )}
      </div>
    </div>
  );
}
