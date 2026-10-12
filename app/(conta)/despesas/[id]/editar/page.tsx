import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Page } from "@/components/app/page-header";
import { NewExpenseForm } from "@/components/forms/new-expense-form";
import { ApiError } from "@/lib/api/errors";
import { getExpense, getGroup, getMe, listCategories } from "@/lib/api/kotta";
import { canEditExpense } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Editar despesa — Kotta Groups",
};

export default async function EditarDespesaPage({ params }: PageProps<"/despesas/[id]/editar">) {
  const { id } = await params;
  const [me, expense, categories] = await Promise.all([
    getMe(),
    getExpense(id).catch((error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
      throw error;
    }),
    listCategories(),
  ]);
  const group = await getGroup(expense.groupId);
  const role = group.members.find((m) => m.id === me.id)?.role;
  if (group.archived || !canEditExpense(me.id, expense.createdByUserId, role)) notFound();

  return (
    <Page width="reading" title="Editar despesa" description="Os saldos do grupo são recalculados ao salvar.">
      <div className="rounded-card border border-kotta-border bg-kotta-surface p-6 sm:p-8">
        <NewExpenseForm
          groups={[
            {
              id: group.id,
              name: group.name,
              emoji: group.emoji,
              members: group.members.map(({ id: memberId, name }) => ({ id: memberId, name })),
            },
          ]}
          categories={categories.map(({ slug, label, emoji }) => ({ slug, label, emoji }))}
          meId={me.id}
          expense={{
            id: expense.id,
            groupId: expense.groupId,
            description: expense.description,
            amountCents: expense.amountCents,
            category: expense.category,
            paidByUserId: expense.paidByUserId,
            splitType: expense.splitType,
            customSplit: expense.customSplit,
          }}
        />
      </div>
    </Page>
  );
}
