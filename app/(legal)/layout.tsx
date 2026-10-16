import Image from "next/image";
import Link from "next/link";
import { LegalLinks } from "@/components/legal/legal-links";

// Fora de PROTECTED e GUEST_ONLY no proxy.ts: abre logada ou não.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-kotta-bg px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-prose">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-display text-xl font-bold text-kotta-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-primary"
        >
          <Image
            src="/kotta-app-icon-green-nobg.png"
            alt=""
            width={485}
            height={448}
            className="size-7 object-contain"
            unoptimized
          />
          Kotta Groups
        </Link>
        <div className="mt-10">{children}</div>
        <LegalLinks className="mt-16 border-t border-kotta-border pt-6" />
      </div>
    </main>
  );
}
