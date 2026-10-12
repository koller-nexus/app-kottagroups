"use client";

import { useActionState } from "react";
import { uploadInvoiceAction } from "@/app/actions/invoices";
import { FormError } from "@/components/auth/field";
import type { FormState } from "@/lib/form";
import { INVOICE_ACCEPT } from "@/lib/invoices";

const initialState: FormState = {};

export function InvoiceUploadForm() {
  const [state, formAction, pending] = useActionState(uploadInvoiceAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormError message={state.error} />
      <div>
        <label htmlFor="invoice-file" className="block text-sm font-semibold text-kotta-text">
          Foto da nota
        </label>
        <input
          id="invoice-file"
          name="file"
          type="file"
          accept={INVOICE_ACCEPT.join(",")}
          required
          aria-describedby="invoice-file-hint"
          className="mt-2 block w-full rounded-control border border-kotta-border-strong bg-kotta-surface text-sm text-kotta-text file:mr-4 file:min-h-12 file:cursor-pointer file:border-0 file:bg-kotta-light-green file:px-4 file:font-semibold file:text-kotta-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
        />
        <p id="invoice-file-hint" className="mt-1.5 text-[13px] text-kotta-muted">
          JPG, PNG, WebP ou TIFF de até 10 MB. A leitura leva alguns segundos.
        </p>
      </div>
      <div>
        <button type="submit" className="primary-action" disabled={pending}>
          {pending ? "Enviando…" : "Enviar nota"}
        </button>
      </div>
    </form>
  );
}
