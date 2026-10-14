import type { ApiExpense, ApiInvoice, ApiInvoiceStatus } from "@/lib/api/types";

// Mesmos tipos e teto que a API aceita (o tipo real é conferido pelo conteúdo).
export const INVOICE_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/tiff"];
export const INVOICE_MAX_BYTES = 10 * 1024 * 1024;

const STATUS_LABEL: Record<ApiInvoiceStatus, string> = {
  queued: "Na fila",
  processing: "Lendo a nota",
  done: "Pronta",
  failed: "Falhou",
  needs_review: "Revisar",
};

export function invoiceStatusLabel(status: string): string {
  return STATUS_LABEL[status as ApiInvoiceStatus] ?? status;
}

/** Ainda em processamento: a tela deve se atualizar sozinha. */
export function isInvoicePending(status: string): boolean {
  return status === "queued" || status === "processing";
}

/** Reais (float da API) para centavos, como o Price espera. */
export function reaisToCents(reais: number): number {
  return Math.round((Number.isFinite(reais) ? reais : 0) * 100);
}

const RISK_LABEL: Record<string, string> = { low: "baixo", medium: "médio", high: "alto" };

export function invoiceRiskLabel(label: string): string {
  return RISK_LABEL[label] ?? label;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
}

/** `items` vem cru da API: [{ description, quantity, unit_amount, line_total }] em reais. */
export function parseInvoiceItems(items: unknown): InvoiceItem[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
    const description = typeof item.description === "string" ? item.description.trim() : "";
    if (!description) return [];
    return [
      {
        description,
        quantity: num(item.quantity),
        unitCents: reaisToCents(num(item.unit_amount)),
        totalCents: reaisToCents(num(item.line_total)),
      },
    ];
  });
}

/** A API grava a falha em inglês; aqui vira texto para quem usa. */
export function invoiceErrorMessage(message: string | undefined): string {
  if (message && /timed out/i.test(message)) {
    return "A leitura demorou demais e foi interrompida. Envie a nota de novo.";
  }
  return "Não conseguimos ler esta nota. Tente uma foto mais nítida e bem iluminada.";
}

/** Nota lida (pronta ou a revisar): só então o total dela vale. */
export function isInvoiceRead(status: string): boolean {
  return status === "done" || status === "needs_review";
}

/** Total da nota menos o valor da despesa, em centavos; null quando a nota não foi lida. */
export function invoiceDifferenceCents(
  invoice: Pick<ApiInvoice, "status" | "estimatedTotal">,
  expense: Pick<ApiExpense, "amountCents">,
): number | null {
  if (!isInvoiceRead(invoice.status)) return null;
  return reaisToCents(invoice.estimatedTotal) - expense.amountCents;
}

/** Despesas que podem receber esta nota: sem nota ou já ligadas a ela. */
export function linkableExpenses<T extends Pick<ApiExpense, "invoiceId">>(
  expenses: T[],
  invoice: Pick<ApiInvoice, "id">,
): T[] {
  return expenses.filter((expense) => expense.invoiceId === null || expense.invoiceId === invoice.id);
}

/** Notas ainda sem despesa (comprovantes de lista inclusos). */
export function unlinkedInvoices<T extends Pick<ApiInvoice, "expenseId">>(invoices: T[]): T[] {
  return invoices.filter((invoice) => invoice.expenseId === null);
}
