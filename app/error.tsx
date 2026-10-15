"use client";

import { RouteError } from "@/components/app/route-error";

export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kotta-bg px-5 py-10">
      <RouteError error={error} retry={retry} homeHref="/" homeLabel="Ir para o início" />
    </main>
  );
}
