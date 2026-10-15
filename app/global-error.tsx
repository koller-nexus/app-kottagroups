"use client";

import { RouteError } from "@/components/app/route-error";
import "./globals.css";

// Falha no root layout: este arquivo substitui o layout inteiro, por isso traz html/body e estilos.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-kotta-bg font-sans text-kotta-text">
        <title>Algo deu errado — Kotta Groups</title>
        <main className="flex min-h-screen items-center justify-center bg-kotta-bg px-5 py-10">
          <RouteError error={error} retry={retry} homeHref="/" homeLabel="Ir para o início" />
        </main>
      </body>
    </html>
  );
}
