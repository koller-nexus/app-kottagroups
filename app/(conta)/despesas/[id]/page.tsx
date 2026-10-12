import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteExpenseAction } from "@/app/actions/expenses";
import { FormError } from "@/components/auth/field";
import { Avatar } from "@/components/app/avatar";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { Page, SectionLabel } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { getExpense, getGroup, getMe, listCategories } from "@/lib/api/kotta";
import type { ApiExpenseDetail } from "@/lib/api/types";
import { categoryLookup } from "@/lib/categories";
import { formatLongDay } from "@/lib/dates";
import { localDay } from "@/lib/kotta-view";
import { canEditExpense } from "@/lib/permissions";
import { displayName, peopleById } from "@/lib/people";

async function loadExpense(id: string): Promise<ApiExpenseDetail> {
  try {
    return await getExpense(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/despesas/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const expense = await getExpense(id);
    return { title: `${expense.description} — Kotta Groups` };
  } catch {
    return { title: "Despesa — Kotta Groups" };
  }
}

export default async function DespesaPage({ params, searchParams }: PageProps<"/despesas/[id]">) {
  const { id } = await params;
  const { confirmar, erro } = await searchParams;
  const [me, expense, categories] = await Promise.all([getMe(), loadExpense(id), listCategories()]);
  const group = await getGroup(expense.groupId);

  const names = peopleById([group]);
  const cat = categoryLookup(categories)(expense.category);
  const role = group.members.find((m) => m.id === me.id)?.role;
  const editable = !group.archived && canEditExpense(me.id, expense.createdByUserId, role);
  const day = formatLongDay(localDay(expense.createdAt));

  return (
    <Page
      width="reading"
      back={{ href: `/grupos/${group.id}`, label: <>{group.emoji} {group.name}</> }}
      leading={
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-card bg-kotta-light-green text-4xl"
        >
          {cat.emoji}
        </span>
      }
      title={expense.description}
      description={`${cat.label} · ${day.charAt(0).toUpperCase()}${day.slice(1)}`}
      actions={
        editable ? (
          <>
            <Link href={`/despesas/${expense.id}/editar`} className="secondary-action">
              Editar
            </Link>
            <Link
              href={`/despesas/${expense.id}?confirmar=excluir`}
              replace
              className="secondary-action text-kotta-danger!"
            >
              Excluir
            </Link>
          </>
        ) : null
      }
    >
      {typeof erro === "string" && erro ? (
        <div>
          <FormError message={friendlyMessage(erro)} />
        </div>
      ) : null}

      {editable && confirmar === "excluir" ? (
        <ConfirmDelete
          title={`Excluir ${expense.description}?`}
          action={deleteExpenseAction}
          fields={{ expenseId: expense.id, groupId: group.id }}
          confirmLabel="Excluir despesa"
          cancelHref={`/despesas/${expense.id}`}
        >
          Os saldos do grupo são recalculados sem ela. Não dá para desfazer.
        </ConfirmDelete>
      ) : null}

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-kotta-border bg-kotta-border sm:grid-cols-2">
        <div className="bg-kotta-surface p-5">
          <dt className="text-[13px] font-semibold text-kotta-muted">Valor</dt>
          <dd className="mt-1">
            <Price cents={expense.amountCents} size={32} className="text-kotta-text" />
          </dd>
        </div>
        <div className="bg-kotta-surface p-5">
          <dt className="text-[13px] font-semibold text-kotta-muted">Quem pagou</dt>
          <dd className="mt-2 text-base font-semibold text-kotta-text">
            {displayName(names, expense.paidByUserId, me.id)}
          </dd>
        </div>
        <div className="bg-kotta-surface p-5">
          <dt className="text-[13px] font-semibold text-kotta-muted">Divisão</dt>
          <dd className="mt-2 text-base text-kotta-text">
            {expense.splitType === "custom" ? "Personalizada" : "Igual entre todos"}
          </dd>
        </div>
        <div className="bg-kotta-surface p-5">
          <dt className="text-[13px] font-semibold text-kotta-muted">Lançada por</dt>
          <dd className="mt-2 text-base text-kotta-text">{displayName(names, expense.createdByUserId, me.id)}</dd>
        </div>
      </dl>

      <section aria-labelledby="partes">
        <SectionLabel id="partes">Parte de cada um</SectionLabel>
        <ul className="divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface">
          {expense.shares.map((share) => (
            <li key={share.userId} className="flex items-center gap-3 px-4 py-3">
              <Avatar person={{ id: share.userId, name: names.get(share.userId) ?? "?" }} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-kotta-text">
                {displayName(names, share.userId, me.id)}
              </span>
              <Price cents={share.amountCents} size={15} className="text-kotta-text" />
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
