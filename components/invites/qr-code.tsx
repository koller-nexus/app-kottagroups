"use client";

import { encode } from "uqr";
import { qrSvgPath } from "@/lib/invites";

// Margem de 4 módulos (já incluída em `data` e `size`): a zona clara que os leitores esperam.
const QUIET_ZONE = 4;

export function QrCode({ value }: { value: string }) {
  const { data, size } = encode(value, { border: QUIET_ZONE });
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="QR code do convite"
      shapeRendering="crispEdges"
      className="aspect-square w-full max-w-56 rounded-control bg-kotta-surface text-kotta-text"
    >
      <path d={qrSvgPath(data)} fill="currentColor" />
    </svg>
  );
}
