import { AppShell } from "@/components/app/app-shell";
import { SessionWatcher } from "@/components/app/session-watcher";
import { getSessionToken } from "@/lib/api/session";
import { sessionMsLeft } from "@/lib/session-expiry";

export default async function ContaLayout({ children }: LayoutProps<"/">) {
  // Só o tempo restante vai ao cliente; o token fica no servidor.
  const msLeft = sessionMsLeft(await getSessionToken());

  return (
    <AppShell>
      <SessionWatcher msLeft={msLeft} />
      {children}
    </AppShell>
  );
}
