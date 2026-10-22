import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgetPasswordScreen } from "@/components/forget-password/forget-password-screen";

export const metadata: Metadata = {
  title: "Redefinir senha — Kotta Groups",
  referrer: "no-referrer",
};

export default function ForgetPasswordPage() {
  return (
    <Suspense fallback={<ForgetPasswordFallback />}>
      <ForgetPasswordScreen />
    </Suspense>
  );
}

function ForgetPasswordFallback() {
  return <p className="text-base text-kotta-muted">Carregando recuperação…</p>;
}
