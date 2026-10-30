"use client";

import { CopyTextButton } from "@/components/app/copy-text-button";
import { buildWhatsAppShareUrl } from "@/lib/share-text";

export function ShareButton({
  text,
  label,
  shareTitle,
}: {
  text: string;
  label: string;
  shareTitle?: string;
}) {
  // Só renderiza no navegador: dá para olhar `navigator` direto.
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function share() {
    try {
      await navigator.share({ title: shareTitle, text });
    } catch {
      // Cancelar a folha de compartilhamento também cai aqui; WhatsApp e copiar seguem na tela.
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      {canShare ? (
        <button type="button" onClick={share} aria-label={label} className="secondary-action">
          {label}
        </button>
      ) : null}
      <a
        href={buildWhatsAppShareUrl(text)}
        target="_blank"
        rel="noreferrer"
        aria-label={`${label} pelo WhatsApp`}
        className="secondary-action"
      >
        Abrir no WhatsApp
      </a>
      <CopyTextButton text={text} label="Copiar texto" copiedLabel="Texto copiado" />
    </div>
  );
}
