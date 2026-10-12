import { AppShell } from "@/components/app/app-shell";
import { Dashboard } from "@/components/app/dashboard";
import { LandingPage } from "@/components/landing/landing-page";
import { getSessionToken } from "@/lib/api/session";

// Com sessão, "/" é o painel; sem sessão, a landing pública com os selos das lojas.
export default async function Home() {
  if (!(await getSessionToken())) return <LandingPage />;
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
