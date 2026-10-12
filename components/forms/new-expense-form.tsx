"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createExpenseAction, type FormState } from "@/app/actions/kotta";
import { Field, FormError } from "@/components/auth/field";

export interface ExpenseFormGroup {
  id: string;
  name: string;
  emoji: string;
  members: { id: string; name: string }[];
}

interface NewExpenseFormProps {
  groups: ExpenseFormGroup[];
  categories: { slug: string; label: string; emoji: string }[];
  meId: string;
  defaultGroupId?: string;
}

const initialState: FormState = {};

const selectClass =
  "mt-2 block min-h-12 w-full rounded-control border border-kotta-border bg-kotta-surface px-4 text-base text-kotta-text outline-none focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20";

export function NewExpenseForm({ groups, categories, meId, defaultGroupId }: NewExpenseFormProps) {
  const [state, formAction, pending] = useActionState(createExpenseAction, initialState);
  const [groupId, setGroupId] = useState(
    state.values?.groupId ?? defaultGroupId ?? groups[0]?.id ?? "",
  );
  const group = groups.find((g) => g.id === groupId);
  const members = group?.members ?? [];
  const defaultPayer = members.some((m) => m.id === meId) ? meId : members[0]?.id;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormError message={state.error} />

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

      <Field
        id="description"
        name="description"
        label="Descrição"
        placeholder="Ex.: Compra do mês"
        maxLength={120}
        required
        defaultValue={state.values?.description}
      />

      <Field
        id="amount"
        name="amount"
        label="Valor (R$)"
        inputMode="decimal"
        placeholder="0,00"
        required
        defaultValue={state.values?.amount}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-kotta-text">
            Categoria
          </label>
          <select
            id="category"
            name="category"
            defaultValue={state.values?.category ?? categories[0]?.slug}
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
            defaultValue={
              state.values?.groupId === groupId ? state.values?.paidByUserId : defaultPayer
            }
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

      <p className="rounded-control bg-kotta-light-green px-4 py-3 text-sm text-kotta-primary">
        O valor é dividido igualmente entre os {members.length} membros do grupo.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={groupId ? `/grupos/${groupId}` : "/painel"} className="secondary-action">
          Cancelar
        </Link>
        <button type="submit" className="primary-action" disabled={pending}>
          {pending ? "Salvando…" : "Salvar despesa"}
        </button>
      </div>
    </form>
  );
}
