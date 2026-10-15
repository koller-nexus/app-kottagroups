"use client";

import { RouteError } from "@/components/app/route-error";

export default function ContaError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError error={error} retry={retry} homeHref="/" homeLabel="Ir para o Painel" />;
}
