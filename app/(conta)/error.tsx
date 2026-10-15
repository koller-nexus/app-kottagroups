"use client";

import { LoadError } from "@/components/app/load-error";

export default function ContaError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadError error={error} retry={retry} />;
}
