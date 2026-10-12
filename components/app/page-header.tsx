import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/app/icons";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
}

function PageHeader({ title, description, leading, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {leading}
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-kotta-text sm:text-[34px]">
            {title}
          </h1>
          {description ? (
            <div className="mt-2 text-[15px] text-kotta-muted">{description}</div>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mb-3 text-xl font-bold text-kotta-text"
    >
      {children}
    </h2>
  );
}

interface PageProps extends PageHeaderProps {
  /** "view" ocupa a área de conteúdo (até 1120 px); "reading" limita a 720 px, alinhado à esquerda. */
  width?: "view" | "reading";
  /** Link de volta acima do título (ex.: do detalhe para o grupo). */
  back?: { href: string; label: ReactNode };
  children: ReactNode;
}

/** Moldura de toda página logada: largura, cabeçalho e ritmo entre seções (32 px; 48 px no desktop). */
export function Page({ width = "view", back, children, ...header }: PageProps) {
  return (
    <div className={width === "reading" ? "max-w-reading" : undefined}>
      {back ? (
        <Link
          href={back.href}
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
        >
          <ArrowLeftIcon className="size-4" />
          {back.label}
        </Link>
      ) : null}
      <PageHeader {...header} />
      <div className="mt-8 flex flex-col gap-8 lg:gap-12">{children}</div>
    </div>
  );
}
