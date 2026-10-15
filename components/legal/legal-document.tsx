import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export interface LegalDocumentContent {
  version: string;
  /** ISO `YYYY-MM-DD`. */
  updatedAt: string;
  /** Verdadeiro até a revisão jurídica. */
  draft: boolean;
  sections: LegalSection[];
}

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function LegalDocument({ title, document }: { title: string; document: LegalDocumentContent }) {
  return (
    <article>
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-kotta-text">{title}</h1>
      <p className="mt-3 text-sm text-kotta-muted">
        Última atualização: {DATE_FORMAT.format(new Date(document.updatedAt))}. Versão {document.version}.
      </p>
      {document.draft ? (
        <p className="mt-6 rounded-control border border-kotta-border bg-kotta-light-green px-4 py-3 text-sm text-kotta-primary">
          Rascunho: este texto ainda passa por revisão jurídica e pode mudar.
        </p>
      ) : null}
      <nav aria-label="Nesta página" className="mt-8 rounded-card border border-kotta-border bg-kotta-surface p-5">
        <h2 className="text-sm font-semibold text-kotta-text">Nesta página</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-1 pl-5 text-sm">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex min-h-8 items-center text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-10 flex flex-col gap-10">
        {document.sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-6">
            <h2 className="text-xl font-bold text-kotta-text">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-3 flex flex-col gap-3 text-base leading-7 text-kotta-text [&_ul]:list-disc [&_ul]:pl-5">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
