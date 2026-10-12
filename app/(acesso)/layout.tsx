import Image from "next/image";
import Link from "next/link";

export default function AcessoLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kotta-bg px-4 py-10 sm:px-8">
      <section className="w-full max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-7 sm:p-10">
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
      </section>
    </main>
  );
}
