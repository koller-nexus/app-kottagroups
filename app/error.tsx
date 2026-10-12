"use client";

import { LoadError } from "@/components/app/load-error";

export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kotta-bg px-5 py-10">
      <LoadError retry={retry} />
    </main>
  );
}
