import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Dashboard } from "@/components/app/dashboard";
import { DashboardView } from "@/components/app/dashboard-view";
import { StoreBadge } from "@/components/landing/store-badge";
import { getSessionToken } from "@/lib/api/session";
import { buildPreviewDashboard } from "@/lib/dashboard-preview";
import { monthSpend } from "@/lib/kotta-view";

// "Hoje" fixo dos dados de exemplo, para as barras do mês não esvaziarem com o tempo.
const PREVIEW_NOW = "2026-09-15T12:00:00Z";

// Com sessão, "/" é o painel com os dados reais. Sem sessão, a dashboard do app
// (mobile-kottagroups/src/screens/Dashboard) com dados de exemplo, Cadastrar e Entrar.
export default async function Home() {
  if (await getSessionToken()) {
    return (
      <AppShell>
        <Dashboard />
      </AppShell>
    );
  }

  const preview = buildPreviewDashboard();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12 sm:px-6 sm:pt-6">
      <header className="flex min-h-[52px] items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-2xl font-bold tracking-[-0.4px] text-kotta-text">
          Kotta Groups
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/cadastrar"
            className="inline-flex min-h-11 items-center rounded-control bg-kotta-light-green px-4 text-[15px] font-bold text-kotta-primary hover:bg-kotta-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
          >
            Cadastrar
          </Link>
          <Link
            href="/entrar"
            className="inline-flex min-h-11 items-center rounded-control bg-kotta-primary px-4 text-[15px] font-bold text-white hover:bg-kotta-primary-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
          >
            Entrar
          </Link>
        </div>
      </header>

      <DashboardView
        receivesCents={preview.receivesCents}
        owesCents={preview.owesCents}
        monthSpend={monthSpend(preview.expenses, PREVIEW_NOW)}
        recent={preview.recent.map((item) => ({ ...item, href: "/entrar" }))}
        groups={preview.groups.map((group) => ({ ...group, href: "/entrar" }))}
        previewNote="Dados de exemplo. Entre para ver os seus."
      />

      <section aria-labelledby="no-celular" className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="no-celular" className="text-xl font-bold text-kotta-text">
            No celular
          </h2>
          <p className="text-[13px] font-semibold text-kotta-primary">Em breve</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StoreBadge store="app-store" />
          <StoreBadge store="play-store" />
        </div>
      </section>
    </main>
  );
}
