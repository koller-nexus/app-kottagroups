import Link from "next/link";
import { BellIcon } from "@/components/app/icons";

export function NotificationsButton({ count }: { count: number }) {
  const label =
    count === 0
      ? "Pagamentos pendentes: nenhum"
      : `Pagamentos pendentes: ${count}`;
  return (
    <Link
      href="/painel#acertos"
      aria-label={label}
      className="relative flex size-11 items-center justify-center rounded-full text-kotta-text hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
    >
      <BellIcon className="size-6" />
      {count > 0 ? (
        <span className="absolute top-1.5 right-1 flex min-w-5 items-center justify-center rounded-pill bg-kotta-danger px-1 text-[10px] font-semibold leading-5 text-white ring-2 ring-kotta-surface">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
