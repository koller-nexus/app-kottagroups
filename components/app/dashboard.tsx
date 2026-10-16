import { Suspense } from "react";
import { DASHBOARD_TAGLINE, DashboardView } from "@/components/app/dashboard-view";
import { Page } from "@/components/app/page-header";
import { SectionBoundary } from "@/components/app/section-error";
import { getDashboard, getMe, listGroupDetails } from "@/lib/api/kotta";
import { dashboardViewFrom } from "@/lib/kotta-view";
import { firstName, peopleById } from "@/lib/people";

export async function Dashboard() {
  // getMe já foi pedido pelo shell; o React.cache devolve o mesmo resultado.
  const me = await getMe();
  return (
    <Page title={`Olá, ${firstName(me.name)}`} description={DASHBOARD_TAGLINE}>
      <SectionBoundary message="Não foi possível carregar o seu painel.">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardData />
        </Suspense>
      </SectionBoundary>
    </Page>
  );
}

async function DashboardData() {
  // Nº fixo de chamadas: o resumo vem pronto e os grupos em lote só dão os nomes da atividade recente.
  const [dashboard, groups] = await Promise.all([getDashboard(), listGroupDetails()]);
  return (
    <DashboardView
      {...dashboardViewFrom(dashboard, peopleById(groups))}
      empty={{
        text: "Você ainda não participa de nenhum grupo. Crie o primeiro.",
        actionLabel: "Criar grupo",
        actionHref: "/grupos/novo",
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
      <span className="sr-only">Carregando…</span>
      <div className="h-48 rounded-card border border-kotta-border bg-kotta-surface" />
      <div className="h-48 rounded-card border border-kotta-border bg-kotta-surface" />
    </div>
  );
}
