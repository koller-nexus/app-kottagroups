import { invoiceStatusLabel } from "@/lib/invoices";

const tones: Record<string, string> = {
  done: "bg-kotta-light-green text-kotta-primary",
  failed: "bg-kotta-danger-bg text-kotta-danger",
};

export function InvoiceStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-control px-2.5 py-1 text-[13px] font-semibold ${
        tones[status] ?? "bg-kotta-bg text-kotta-muted"
      }`}
    >
      {invoiceStatusLabel(status)}
    </span>
  );
}
