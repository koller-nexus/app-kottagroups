"use client";

import dynamic from "next/dynamic";
import { startTransition, useActionState, useState } from "react";
import { submitReceiptCodeAction } from "@/app/actions/shopping";
import { Field, FormError } from "@/components/auth/field";
import { ReceiptUploadForm } from "@/components/forms/shopping-forms";
import type { FormState } from "@/lib/form";
import { ACCESS_KEY_LENGTH, accessKeyProblem, formatAccessKey } from "@/lib/receipt";

// Câmera e leitor de QR só baixam quando a pessoa toca em escanear.
const QrScanner = dynamic(() => import("./qr-scanner"), { ssr: false });

const initialState: FormState = {};

/** Traz a nota para a lista: QR code primeiro; foto e chave digitada quando o QR não dá. */
export function ReceiptCapture({ listId, failedMessage }: { listId: string; failedMessage?: string }) {
  const [scanning, setScanning] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [noCamera, setNoCamera] = useState(false);
  const [state, formAction, pending] = useActionState(submitReceiptCodeAction, initialState);

  function submitQr(qrUrl: string) {
    setScanning(false);
    const data = new FormData();
    data.set("listId", listId);
    data.set("qrUrl", qrUrl);
    startTransition(() => formAction(data));
  }

  function cameraUnavailable() {
    setScanning(false);
    setNoCamera(true);
    setKeyOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-kotta-border bg-kotta-surface p-4">
      <div>
        <h2 className="text-base font-semibold text-kotta-text">Nota fiscal</h2>
        <p className="mt-1 text-[13px] text-kotta-muted">
          Escaneie o QR code da nota e os itens comprados são marcados na lista.
        </p>
      </div>
      <FormError message={failedMessage} />
      <FormError message={state.error} />
      {noCamera ? (
        <p role="status" className="text-sm text-kotta-text">
          Não conseguimos usar a câmera. Digite a chave ou envie uma imagem da nota.
        </p>
      ) : null}
      {pending ? (
        <p role="status" className="text-sm font-semibold text-kotta-text">
          Enviando nota…
        </p>
      ) : null}

      <button type="button" className="primary-action" disabled={pending} onClick={() => setScanning(true)}>
        {failedMessage ? "Tentar de novo" : "Escanear QR code"}
      </button>
      {scanning ? (
        <QrScanner onDetected={submitQr} onUnavailable={cameraUnavailable} onClose={() => setScanning(false)} />
      ) : null}

      <ReceiptUploadForm listId={listId} onQrDetected={submitQr} />

      <details open={keyOpen} onToggle={(event) => setKeyOpen(event.currentTarget.open)} className="group">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary">
          Digitar a chave de acesso
        </summary>
        <AccessKeyForm listId={listId} action={formAction} pending={pending} />
      </details>
    </div>
  );
}

function AccessKeyForm({
  listId,
  action,
  pending,
}: {
  listId: string;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const problem = accessKeyProblem(value);
  const complete = value.replace(/\D/g, "").length === ACCESS_KEY_LENGTH;
  const showProblem = Boolean(problem) && (touched || complete);

  return (
    <form action={action} className="mt-2 flex flex-col gap-3" noValidate>
      <input type="hidden" name="listId" value={listId} />
      <Field
        id={`chave-${listId}`}
        name="accessKey"
        label="Chave de acesso (44 números)"
        hint={showProblem && problem ? problem : "Fica embaixo do código de barras da nota."}
        value={formatAccessKey(value)}
        onChange={(event) => setValue(event.currentTarget.value)}
        onBlur={() => setTouched(true)}
        inputMode="numeric"
        autoComplete="off"
        maxLength={54}
        aria-invalid={showProblem}
      />
      <button type="submit" className="secondary-action" disabled={pending || Boolean(problem)}>
        Enviar chave
      </button>
    </form>
  );
}
