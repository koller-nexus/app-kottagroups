"use client";

import { useState } from "react";
import type { ApiReceiptFile } from "@/lib/api/types";
import { httpsUrl } from "@/lib/https-url";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

/** Foto enviada, para conferir a leitura. Clicar abre o original numa nova aba. */
export function InvoicePhoto({ file, name }: { file: ApiReceiptFile; name: string }) {
  const [failed, setFailed] = useState(false);
  const url = httpsUrl(file.url);

  if (!url || failed) {
    return (
      <div className="flex flex-col gap-2 rounded-card border border-kotta-border bg-kotta-surface p-6">
        <p className="text-sm text-kotta-muted">Não foi possível carregar a foto.</p>
        {/* TIFF não abre em todo navegador, mas o arquivo ainda pode ser baixado. */}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-11 items-center text-sm font-semibold text-kotta-primary hover:underline ${focusRing}`}
          >
            Abrir foto
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block overflow-hidden rounded-card border border-kotta-border bg-kotta-surface ${focusRing}`}
    >
      {/* URL assinada e temporária da API: next/image não ajuda aqui. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Foto enviada: ${name}`}
        // É o maior elemento da página da nota: carrega já, só decodifica fora da thread principal.
        decoding="async"
        onError={() => setFailed(true)}
        // A imagem pode falhar antes da hidratação, quando o onError ainda não existe.
        ref={(img) => {
          if (img?.complete && img.naturalWidth === 0) setFailed(true);
        }}
        className="w-full object-contain lg:max-h-[calc(100vh-3rem)]"
      />
    </a>
  );
}
