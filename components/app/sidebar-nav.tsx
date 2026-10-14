"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GroupsIcon, HomeIcon, UserIcon } from "@/components/app/icons";
import { isActive, navItems, type NavIcon } from "@/components/app/nav-items";

const icons: Record<NavIcon, typeof HomeIcon> = {
  home: HomeIcon,
  groups: GroupsIcon,
  user: UserIcon,
};

interface GroupLink {
  id: string;
  name: string;
  emoji: string;
}

export function SidebarNav({ groupLinks }: { groupLinks: GroupLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="-mx-1 flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-1">
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-control px-3 py-2.5 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
                  active
                    ? "bg-kotta-light-green text-kotta-primary"
                    : "text-kotta-text hover:bg-kotta-overlay"
                }`}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div>
        <p className="px-3 text-[13px] font-semibold text-kotta-muted">
          Seus grupos
        </p>
        <ul className="mt-2 flex flex-col gap-0.5">
          {groupLinks.map((group) => {
            const href = `/grupos/${group.id}`;
            const active = isActive(pathname, href);
            return (
              <li key={group.id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
                    active
                      ? "bg-kotta-light-green font-semibold text-kotta-primary"
                      : "text-kotta-text hover:bg-kotta-overlay"
                  }`}
                >
                  <span aria-hidden="true" className="text-base">
                    {group.emoji}
                  </span>
                  <span className="truncate">{group.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-kotta-border bg-kotta-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-kotta-primary ${
                  active ? "text-kotta-primary" : "text-kotta-muted"
                }`}
              >
                <Icon className="size-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
