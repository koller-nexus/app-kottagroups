import { InvoiceUploadForm } from "@/components/forms/invoice-upload-form";

/** Nota que falhou não tem nova leitura: o caminho é enviar outra foto ao grupo. */
export function InvoiceFailedRecovery({ groupId }: { groupId: string }) {
  return (
    <section aria-labelledby="enviar-outra-foto" className="flex flex-col gap-4">
      <h2 id="enviar-outra-foto" className="text-base font-semibold text-kotta-text">
        Esta nota não pode ser lida de novo. Envie outra foto.
      </h2>
      <InvoiceUploadForm groupId={groupId} />
    </section>
  );
}
