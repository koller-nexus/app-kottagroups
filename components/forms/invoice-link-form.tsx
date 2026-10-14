import { linkInvoiceAction, unlinkInvoiceAction } from "@/app/actions/invoices";

export interface LinkOption {
  id: string;
  label: string;
}

interface InvoiceLinkFormProps {
  /** Campos ocultos: groupId, returnTo e o lado já conhecido (invoiceId ou expenseId). */
  fields: Record<string, string>;
  /** Lado escolhido no seletor. */
  selectName: "expenseId" | "invoiceId";
  label: string;
  options: LinkOption[];
  selectedId?: string | null;
  submitLabel: string;
}

const selectClass =
  "min-h-12 w-full rounded-control border border-kotta-border-strong bg-kotta-surface px-3 text-base text-kotta-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary sm:flex-1";

function HiddenFields({ fields }: { fields: Record<string, string> }) {
  return Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />);
}

/** Liga uma nota a uma despesa do mesmo grupo, escolhendo um dos lados num seletor nativo. */
export function InvoiceLinkForm({ fields, selectName, label, options, selectedId, submitLabel }: InvoiceLinkFormProps) {
  const selectId = `link-${selectName}`;
  return (
    <form action={linkInvoiceAction} className="flex flex-col gap-2">
      <HiddenFields fields={fields} />
      <label htmlFor={selectId} className="text-sm font-semibold text-kotta-text">
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select id={selectId} name={selectName} required defaultValue={selectedId ?? ""} className={selectClass}>
          <option value="" disabled>
            Escolha
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="primary-action">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Desfaz o vínculo; a nota continua no grupo. */
export function InvoiceUnlinkButton({ fields }: { fields: Record<string, string> }) {
  return (
    <form action={unlinkInvoiceAction}>
      <HiddenFields fields={fields} />
      <button type="submit" className="secondary-action">
        Desvincular
      </button>
    </form>
  );
}
