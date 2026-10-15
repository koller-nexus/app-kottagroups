import type { ReactNode } from "react";
import { ERROR_COPY, type ErrorKind } from "@/lib/error-state";

// Um traço por variante; decorativo, o título já diz o que houve.
const GLYPH_PATHS: Record<ErrorKind, string> = {
  "not-found": "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM20 20l-4.9-4.9",
  "session-expired": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
  offline: "M3 3l18 18M8.5 16.5a5 5 0 0 1 5.6-1M5 13a10 10 0 0 1 3.3-2.3M12 20h.01M19 13a10 10 0 0 0-5.4-2.9",
  unavailable: "M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0",
  unexpected: "M12 4l9 16H3l9-16Zm0 6v4m0 3h.01",
};

/** Conteúdo de uma tela de erro. O cartão em volta é de quem usa (PublicFrame ou RouteError). */
export function ErrorState({
  kind,
  title = ERROR_COPY[kind].title,
  text = ERROR_COPY[kind].text,
  code,
  primary,
  secondary,
}: {
  kind: ErrorKind;
  title?: string;
  text?: string;
  /** Identificador para suporte ("Código: …"); omitido quando não há. */
  code?: string;
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-kotta-light-green text-kotta-primary">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={GLYPH_PATHS[kind]} />
        </svg>
      </span>
      <h1 className="mt-5 text-2xl font-bold text-kotta-text">{title}</h1>
      <p className="mt-3 text-sm text-kotta-muted">{text}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {primary}
        {secondary}
      </div>
      {code ? <p className="mt-4 text-xs text-kotta-muted">Código: {code}</p> : null}
    </div>
  );
}
