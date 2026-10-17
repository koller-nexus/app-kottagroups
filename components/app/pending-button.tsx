"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botão de envio de um form com Server Action: desabilita e troca o texto enquanto envia. */
export function PendingButton({
  children,
  pendingLabel,
  className = "primary-action",
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
