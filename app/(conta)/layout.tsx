import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/app/avatar";
import { NotificationsButton } from "@/components/app/notifications-button";
import { MobileTabBar, SidebarNav } from "@/components/app/sidebar-nav";
import { CURRENT_USER_ID, getMember, groups } from "@/lib/demo-app";

const groupLinks = groups.map(({ id, name, emoji }) => ({ id, name, emoji }));

export default function ContaLayout({ children }: LayoutProps<"/">) {
  const me = getMember(CURRENT_USER_ID);

  return (
    <div className="flex min-h-screen flex-1 bg-kotta-bg">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-control bg-kotta-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-10 border-r border-kotta-border bg-kotta-surface px-4 py-6 lg:flex">
        <Brand />
        <SidebarNav groupLinks={groupLinks} />
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-control border border-kotta-border p-3 hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
        >
          <Avatar member={me} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-kotta-text">
              {me.name}
            </span>
            <span className="block truncate font-mono text-[11px] text-kotta-muted">
              {me.email}
            </span>
          </span>
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-kotta-border bg-kotta-surface/95 px-5 backdrop-blur lg:hidden">
          <Brand />
          <NotificationsButton />
        </header>

        <main
          id="conteudo"
          className="mx-auto w-full max-w-6xl flex-1 px-5 pt-6 pb-28 sm:px-8 lg:px-10 lg:pt-10 lg:pb-16"
        >
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
      href="/painel"
      className="flex items-center gap-2.5 px-1 font-display text-[22px] font-bold leading-none text-kotta-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-primary"
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
