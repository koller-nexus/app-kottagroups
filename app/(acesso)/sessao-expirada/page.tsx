import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@/components/app/error-state";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Sua sessão expirou — Kotta Groups",
};

const MOTIVOS = new Set(["expirada", "envio"]);

// Fora de PROTECTED e GUEST_ONLY no proxy.ts: abre logada ou não.
export default async function SessaoExpiradaPage({ searchParams }: PageProps<"/sessao-expirada">) {
  const { next, motivo } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  const motivoValue = Array.isArray(motivo) ? motivo[0] : motivo;
  const params = new URLSearchParams({ motivo: motivoValue && MOTIVOS.has(motivoValue) ? motivoValue : "expirada" });
  if (nextPath !== "/") params.set("next", nextPath);

  return (
    <ErrorState
      kind="session-expired"
      primary={
        <Link href={`/entrar?${params}`} className="primary-action">
          Entrar de novo
        </Link>
      }
    />
  );
}
