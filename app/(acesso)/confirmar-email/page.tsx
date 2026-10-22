import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmEmailScreen } from "@/components/confirm-email/confirm-email-screen";

export const metadata: Metadata = {
  title: "Confirmar e-mail — Kotta Groups",
  referrer: "no-referrer",
};

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailFallback />}>
      <ConfirmEmailScreen />
    </Suspense>
  );
}

function ConfirmEmailFallback() {
  return <p className="text-base text-kotta-muted">Carregando confirmação…</p>;
}
