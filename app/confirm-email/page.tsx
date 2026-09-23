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
  return (
    <main className="flex min-h-screen items-center justify-center bg-kotta-bg px-5 py-10">
      <div className="w-full max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-7 sm:p-10">
        <p className="font-display text-xl font-bold text-kotta-primary">Kotta Groups</p>
        <p className="mt-12 text-base text-kotta-muted">Carregando confirmação…</p>
      </div>
    </main>
  );
}
