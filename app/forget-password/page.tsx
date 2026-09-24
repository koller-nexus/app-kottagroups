import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgetPasswordScreen } from "@/components/forget-password/forget-password-screen";

export const metadata: Metadata = {
  title: "Redefinir senha — Kotta Groups",
};

export default function ForgetPasswordPage() {
  return (
    <Suspense fallback={<ForgetPasswordFallback />}>
      <ForgetPasswordScreen />
    </Suspense>
  );
}

function ForgetPasswordFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kotta-bg px-5 py-10">
      <div className="w-full max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-7 sm:p-10">
        <p className="font-display text-xl font-bold text-kotta-primary">Kotta Groups</p>
        <p className="mt-12 text-base text-kotta-muted">Carregando recuperação…</p>
      </div>
    </main>
  );
}
