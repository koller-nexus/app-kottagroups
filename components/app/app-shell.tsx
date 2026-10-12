import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/app/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationsButton } from "@/components/app/notifications-button";
import { MobileTabBar, SidebarNav } from "@/components/app/sidebar-nav";
import { SubmitLostNotice } from "@/components/app/submit-lost-notice";
import { getMe, getNotificationCount, listGroups } from "@/lib/api/kotta";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [me, groups, pendingCount] = await Promise.all([
    getMe(),
    listGroups(),
    getNotificationCount(),
  ]);
  const groupLinks = groups.map(({ id, name, emoji }) => ({ id, name, emoji }));

  return (
    <div className="flex min-h-screen flex-1 bg-kotta-bg">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-control bg-kotta-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-10 overflow-hidden border-r border-kotta-border bg-kotta-surface px-4 py-6 lg:flex">
        <div className="flex items-center justify-between">
          <Brand />
          <NotificationsButton count={pendingCount} />
        </div>
        <SidebarNav groupLinks={groupLinks} />
        <div className="flex flex-col gap-2">
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-control border border-kotta-border p-3 hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
          >
            <Avatar person={me} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-kotta-text">{me.name}</span>
              <span className="block truncate text-xs text-kotta-muted">{me.email}</span>
            </span>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-kotta-border bg-kotta-surface/95 px-4 backdrop-blur sm:px-8 lg:hidden">
          <Brand />
          <NotificationsButton count={pendingCount} />
        </header>

        <main
          id="conteudo"
          className="mx-auto w-full max-w-view flex-1 px-4 pt-6 pb-[calc(4rem+env(safe-area-inset-bottom)+2rem)] sm:px-8 lg:px-10 lg:pt-10 lg:pb-16"
        >
          <Suspense fallback={null}>
            <SubmitLostNotice />
          </Suspense>
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 whitespace-nowrap px-1 font-display text-[22px] font-bold leading-none text-kotta-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-primary"
    >
      <Image
        src="/kotta-app-icon-green-nobg.png"
        alt=""
        width={485}
        height={448}
        className="size-8 object-contain"
        unoptimized
      />
      Kotta Groups
    </Link>
  );
}
