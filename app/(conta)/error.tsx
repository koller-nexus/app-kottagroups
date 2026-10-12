"use client";

import { LoadError } from "@/components/app/load-error";

export default function ContaError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadError retry={retry} />;
}
