"use client";

import { useState } from "react";

/** Foto da conta; se não carregar (foto removida, inexistente, erro de rede), mostra o `fallback` (iniciais). */
export function AvatarPhoto({ src, fallback }: { src: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL imutável já na CDN; o navegador a guarda em cache sem passar pelo otimizador do Next
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="size-full object-cover"
      onError={() => setFailed(true)}
      // A imagem pode falhar antes da hidratação, quando o onError ainda não existe.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
    />
  );
}
