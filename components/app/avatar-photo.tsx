"use client";

import { useState } from "react";

/** Foto da conta; se não carregar (link expirado, quebrado), mostra o `fallback` (iniciais). */
export function AvatarPhoto({ src, fallback }: { src: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- link assinado que expira; next/image o otimizaria e cachearia
    <img
      src={src}
      alt=""
      loading="lazy"
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
