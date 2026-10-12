import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, leading, actions }: PageHeaderProps) {
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
