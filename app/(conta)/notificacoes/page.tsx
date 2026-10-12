import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/app/avatar";
import { CopyTextButton } from "@/components/app/copy-text-button";
import { Page } from "@/components/app/page-header";
import { Price } from "@/components/app/price";
import { getMe, listGroupDetails, listNotificationsPage } from "@/lib/api/kotta";
import { firstName, peopleById } from "@/lib/people";

export const metadata: Metadata = {
  title: "Notificações — Kotta Groups",
};

const tabs = [
  { status: "unpaid", label: "Pendentes", href: "/notificacoes" },
  { status: "all", label: "Todas", href: "/notificacoes?status=all" },
] as const;

export default async function NotificacoesPage({ searchParams }: PageProps<"/notificacoes">) {
  const query = await searchParams;
  const status = query.status === "all" ? "all" : "unpaid";
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  const [me, groups, page] = await Promise.all([
    getMe(),
    listGroupDetails(),
    listNotificationsPage(status, 20, cursor),
  ]);
  const names = peopleById(groups);
  const pendingIncoming = page.items.some((item) => item.direction === "incoming" && !item.paid);
  const base = status === "all" ? "/notificacoes?status=all" : "/notificacoes";

  return (
    <Page title="Notificações" description="Quem te paga e quem você paga nos seus grupos.">
      <div>
        <nav aria-label="Filtro" className="inline-flex rounded-control bg-kotta-surface p-1">
          {tabs.map((tab) => {
            const active = tab.status === status;
            return (
              <Link
                key={tab.status}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-control px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary ${
                  active ? "bg-kotta-light-green text-kotta-primary" : "text-kotta-muted hover:text-kotta-text"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {page.items.length === 0 ? (
          <div className="mt-6 rounded-card border border-dashed border-kotta-border bg-kotta-surface p-10 text-center">
            <p className="text-lg font-semibold text-kotta-text">Nenhuma pendência</p>
            <p className="mt-1 text-sm text-kotta-muted">
              {cursor ? "Não há mais itens por aqui." : "Tudo em dia nos seus grupos."}
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {page.items.map((item) => {
              const youReceive = item.direction === "incoming";
              const otherId = youReceive ? item.from : item.to;
              const otherName = names.get(otherId);
              const shortName = otherName ? firstName(otherName) : "Ex-membro";
              return (
                <li key={item.id}>
                  <Link
                    href={`/grupos/${item.group.id}?aba=saldos`}
                    className="flex min-h-[68px] items-center gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                  >
                    <Avatar person={{ id: otherId, name: otherName ?? "?" }} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-base font-semibold text-kotta-text">
                        {youReceive ? `${shortName} te paga` : `Você paga pra ${shortName}`}
                      </span>
                      <span className="truncate text-[13px] text-kotta-muted">{item.group.name}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Price
                        cents={item.amountCents}
                        size={18}
                        sign={youReceive ? "+" : "−"}
                        settled={item.paid}
                        className={item.paid ? "" : youReceive ? "text-kotta-primary" : "text-kotta-danger"}
                      />
                      <span
                        className={`text-[13px] font-semibold ${item.paid ? "text-kotta-primary" : "text-kotta-muted"}`}
                      >
                        {item.paid ? "Pago" : "Pendente"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {pendingIncoming && me.pixKey ? (
            <CopyTextButton
              text={me.pixKey}
              label="Copiar minha chave Pix"
              copiedLabel="Sua chave Pix foi copiada."
            />
          ) : null}
          <div className="flex flex-wrap gap-3">
            {cursor ? (
              <Link href={base} className="secondary-action">
                Voltar ao início
              </Link>
            ) : null}
            {page.hasMore && page.nextCursor ? (
              <Link
                href={`${base}${status === "all" ? "&" : "?"}cursor=${encodeURIComponent(page.nextCursor)}`}
                className="secondary-action"
              >
                Carregar mais
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Page>
  );
}
