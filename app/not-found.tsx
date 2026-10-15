import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/app/back-button";
import { ErrorState } from "@/components/app/error-state";
import { PublicFrame } from "@/components/app/public-frame";
import { getSessionToken } from "@/lib/api/session";

// O Next já injeta <meta name="robots" content="noindex"> em toda página não encontrada.
export const metadata: Metadata = {
  title: "Página não encontrada — Kotta Groups",
};

// Qualquer URL que não casa com rota nenhuma, logada ou não. Itens inexistentes dentro
// da área logada usam app/(conta)/not-found.tsx, com cabeçalho e abas.
export default async function NotFound() {
  const hasSession = Boolean(await getSessionToken());

  return (
    <PublicFrame>
      <ErrorState
        kind="not-found"
        primary={
          <Link href="/" className="primary-action">
            {hasSession ? "Ir para o Painel" : "Ir para o início"}
          </Link>
        }
        secondary={<BackButton fallbackHref="/" />}
      />
    </PublicFrame>
  );
}
