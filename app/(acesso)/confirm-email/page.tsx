import { Suspense } from "react";
import { ConfirmEmailScreen } from "@/components/confirm-email/confirm-email-screen";

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailFallback />}>
      <ConfirmEmailScreen />
    </Suspense>
  );
}

function ConfirmEmailFallback() {
  return <p className="text-base text-kotta-muted">Carregando confirmação…</p>;
}
