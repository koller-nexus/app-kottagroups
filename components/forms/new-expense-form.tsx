"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createExpenseAction, updateExpenseAction } from "@/app/actions/expenses";
import { Field, FormError } from "@/components/auth/field";
import type { FormState } from "@/lib/form";
import { parseAmountToCents } from "@/lib/kotta-view";
import { parseCustomSplit } from "@/lib/split";

export interface ExpenseFormGroup {
  id: string;
  name: string;
  emoji: string;
  members: { id: string; name: string }[];
}

export interface ExpenseFormValues {
  id: string;
  groupId: string;
  description: string;
  amountCents: number;
  category: string;
  paidByUserId: string;
  splitType: "equal" | "custom";
  customSplit?: Record<string, number> | null;
}

interface NewExpenseFormProps {
  groups: ExpenseFormGroup[];
  categories: { slug: string; label: string; emoji: string }[];
  meId: string;
  defaultGroupId?: string;
  /** Com despesa, o formulário edita em vez de criar. */
  expense?: ExpenseFormValues;
}

const initialState: FormState = {};

const selectClass =
  "mt-2 block min-h-12 w-full rounded-control border border-kotta-border bg-kotta-surface px-4 text-base text-kotta-text outline-none focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20";

const toInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

function editValues(expense: ExpenseFormValues | undefined): Record<string, string> {
  if (!expense) return {};
  const values: Record<string, string> = {
    groupId: expense.groupId,
    description: expense.description,
    amount: toInput(expense.amountCents),
    category: expense.category,
    paidByUserId: expense.paidByUserId,
    splitType: expense.splitType,
  };
  for (const [userId, cents] of Object.entries(expense.customSplit ?? {})) {
    values[`split:${userId}`] = toInput(cents);
  }
  return values;
}

export function NewExpenseForm({ groups, categories, meId, defaultGroupId, expense }: NewExpenseFormProps) {
  const [state, formAction, pending] = useActionState(
    expense ? updateExpenseAction : createExpenseAction,
    initialState,
  );
  const initial = state.values ?? editValues(expense);
  const [groupId, setGroupId] = useState(initial.groupId || defaultGroupId || groups[0]?.id || "");
  const [splitType, setSplitType] = useState(initial.splitType === "custom" ? "custom" : "equal");
  const [amount, setAmount] = useState(initial.amount ?? "");
  const [shares, setShares] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(initial)) {
      if (key.startsWith("split:")) out[key.slice(6)] = value;
    }
    return out;
  });

  const group = groups.find((g) => g.id === groupId);
  const members = group?.members ?? [];
  const defaultPayer = members.some((m) => m.id === meId) ? meId : members[0]?.id;

  // Conferência ao vivo da divisão personalizada (o servidor confere de novo).
  const totalCents = parseAmountToCents(amount);
  const check =
    totalCents === null
      ? null
      : parseCustomSplit(Object.fromEntries(members.map((m) => [m.id, shares[m.id] ?? ""])), totalCents);
  const splitOk = check !== null && "split" in check;
  const splitHint =
    check === null
      ? "Informe o valor total para conferir a divisão."
      : "error" in check
        ? check.error
        : "A divisão fecha com o total.";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormError message={state.error} />
      {expense ? <input type="hidden" name="expenseId" value={expense.id} /> : null}

      {expense ? (
        <div>
          <input type="hidden" name="groupId" value={groupId} />
          <p className="text-sm font-semibold text-kotta-text">Grupo</p>
          <p className="mt-2 text-base text-kotta-text">
            {group ? `${group.emoji} ${group.name}` : "Grupo"}
          </p>
        </div>
      ) : (
        <div>
          <label htmlFor="groupId" className="block text-sm font-semibold text-kotta-text">
            Grupo
          </label>
          <select
            id="groupId"
            name="groupId"
            // defaultValue (não value): o reset do formulário após cada envio
            // volta para a opção padrão, e com `value` ela seria a primeira.
            defaultValue={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            className={selectClass}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Field
        id="description"
        name="description"
        label="Descrição"
        placeholder="Ex.: Compra do mês"
        maxLength={120}
        required
        defaultValue={initial.description}
      />

      <Field
        id="amount"
        name="amount"
        label="Valor (R$)"
        inputMode="decimal"
        placeholder="0,00"
        required
        defaultValue={initial.amount}
        onChange={(event) => setAmount(event.target.value)}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-kotta-text">
            Categoria
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initial.category ?? categories[0]?.slug}
            className={selectClass}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="paidByUserId" className="block text-sm font-semibold text-kotta-text">
            Quem pagou
          </label>
          <select
            key={groupId}
            id="paidByUserId"
            name="paidByUserId"
            defaultValue={initial.groupId === groupId ? initial.paidByUserId : defaultPayer}
            className={selectClass}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === meId ? `${m.name} (você)` : m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-kotta-text">Divisão</legend>
        <div className="mt-2 grid grid-cols-2 rounded-control border border-kotta-border bg-kotta-surface p-1">
          {(
            [
              ["equal", "Igual"],
              ["custom", "Personalizada"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-[9px] text-sm font-semibold text-kotta-muted has-checked:bg-kotta-primary has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-kotta-primary"
            >
              <input
                type="radio"
                name="splitType"
                value={value}
                defaultChecked={splitType === value}
                onChange={() => setSplitType(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {splitType === "equal" ? (
        <p className="rounded-control bg-kotta-light-green px-4 py-3 text-sm text-kotta-primary">
          O valor é dividido igualmente entre os {members.length} membros do grupo.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-4">
                <label htmlFor={`split-${m.id}`} className="min-w-0 flex-1 truncate text-sm text-kotta-text">
                  {m.id === meId ? `${m.name} (você)` : m.name}
                </label>
                <input
                  id={`split-${m.id}`}
                  name={`split:${m.id}`}
                  inputMode="decimal"
                  placeholder="0,00"
                  defaultValue={shares[m.id]}
                  onChange={(event) => {
                    const next = event.target.value;
                    setShares((current) => ({ ...current, [m.id]: next }));
                  }}
                  className="block min-h-12 w-36 rounded-control border border-kotta-border bg-kotta-surface px-4 text-right text-base tabular-nums text-kotta-text outline-none focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20"
                />
              </li>
            ))}
          </ul>
          <p
            aria-live="polite"
            className={`rounded-control px-4 py-3 text-sm ${
              splitOk ? "bg-kotta-light-green text-kotta-primary" : "bg-kotta-danger-bg text-kotta-danger"
            }`}
          >
            {splitHint}
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={expense ? `/despesas/${expense.id}` : groupId ? `/grupos/${groupId}` : "/"}
          className="secondary-action"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="primary-action"
          disabled={pending || (splitType === "custom" && !splitOk)}
        >
          {pending ? "Salvando…" : expense ? "Salvar alterações" : "Salvar despesa"}
        </button>
      </div>
    </form>
  );
}
