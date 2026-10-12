import Link from "next/link";
import { BalanceChip } from "@/components/app/balance-chip";
import { GardenField } from "@/components/app/garden-field";
import { Price } from "@/components/app/price";

export interface DashboardSettlement {
  id: string;
  youReceive: boolean;
  otherName: string;
  amountCents: number;
  paid: boolean;
  /** Nome do grupo, quando a lista mistura grupos. */
  groupName?: string;
  href: string;
}

export interface DashboardGroup {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  netCents: number;
  href: string;
}

interface DashboardViewProps {
  receivesCents: number;
  owesCents: number;
  monthSpend: { currentMonthCents: number; previousMonthCents: number };
  recent: DashboardSettlement[];
  groups: DashboardGroup[];
  /** Aviso dos dados de exemplo (dashboard sem login). */
  previewNote?: string;
  empty?: { text: string; actionLabel: string; actionHref: string };
}

/** A dashboard do app (mobile-kottagroups/src/screens/Dashboard), na web. */
export function DashboardView({
  receivesCents,
  owesCents,
  monthSpend,
  recent,
  groups,
  previewNote,
  empty,
}: DashboardViewProps) {
  const totalNet = receivesCents - owesCents;
  const monthMax = Math.max(monthSpend.currentMonthCents, monthSpend.previousMonthCents);
  const bars = [
    { key: "prev", label: "Mês passado", value: monthSpend.previousMonthCents, fill: "bg-kotta-border-strong" },
    { key: "this", label: "Este mês", value: monthSpend.currentMonthCents, fill: "bg-kotta-primary" },
  ];

  return (
    <>
      <p className="mt-1 max-w-80 text-base leading-[23px] text-kotta-muted">
        Dividir os gastos da viagem sem fazer conta de cabeça.
      </p>

      <GardenField className="mt-6">
        <p className="text-[13px] font-semibold text-kotta-on-field-muted">
          Seu saldo · {totalNet >= 0 ? "a receber" : "a pagar"}
        </p>
        <Price
          cents={totalNet}
          size={44}
          className={totalNet >= 0 ? "text-white" : "text-kotta-on-field-owes"}
        />
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-semibold text-kotta-on-field-muted">Você recebe</p>
            <Price cents={receivesCents} size={22} className="text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-semibold text-kotta-on-field-muted">Você deve</p>
            <Price cents={owesCents} size={22} className="text-white" />
          </div>
        </div>
        {previewNote ? (
          <p className="mt-4 text-[13px] text-kotta-on-field-muted">{previewNote}</p>
        ) : null}
      </GardenField>

      <section aria-labelledby="gastos" className="mt-8 flex flex-col gap-3 rounded-card bg-kotta-surface p-5">
        <h2 id="gastos" className="mb-1 text-[17px] font-bold text-kotta-text">
          Gastos dos grupos
        </h2>
        {bars.map((bar) => (
          <div key={bar.key} className="flex items-center gap-3">
            <p className="w-[88px] shrink-0 text-[13px] font-semibold text-kotta-muted">{bar.label}</p>
            <div className="h-2 flex-1 overflow-hidden rounded-pill bg-kotta-border">
              <div
                className={`h-full rounded-pill ${bar.fill}`}
                style={{ width: `${monthMax > 0 ? (bar.value / monthMax) * 100 : 0}%` }}
              />
            </div>
            <div className="min-w-[92px] text-right">
              <Price cents={bar.value} size={15} className="text-kotta-text" />
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="quitacoes" id="acertos" className="scroll-mt-24">
        <h2 id="quitacoes" className="mt-8 mb-3 text-xl font-bold text-kotta-text">
          Últimas quitações
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-kotta-muted">Nenhuma quitação pendente por aqui.</p>
        ) : (
          <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex min-h-[68px] items-center gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-base font-semibold text-kotta-text">
                      {item.youReceive ? `${item.otherName} te paga` : `Você paga pra ${item.otherName}`}
                    </span>
                    <span className="text-[13px] text-kotta-muted">
                      {item.groupName ? `${item.groupName} · ` : null}
                      <span className={`font-semibold ${item.paid ? "text-kotta-primary" : ""}`}>
                        {item.paid ? "Pago" : "Pendente"}
                      </span>
                    </span>
                  </span>
                  <Price
                    cents={item.amountCents}
                    size={18}
                    sign={item.youReceive ? "+" : "−"}
                    className={item.youReceive ? "text-kotta-primary" : "text-kotta-danger"}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="grupos">
        <h2 id="grupos" className="mt-8 mb-3 text-xl font-bold text-kotta-text">
          Seus grupos{groups.length > 0 ? ` · ${groups.length}` : ""}
        </h2>
        {groups.length === 0 ? (
          empty ? (
            <div className="flex flex-col items-center gap-4 rounded-card bg-kotta-surface p-5 text-center">
              <p className="text-[15px] leading-[22px] text-kotta-muted">{empty.text}</p>
              <Link href={empty.actionHref} className="primary-action px-8">
                {empty.actionLabel}
              </Link>
            </div>
          ) : null
        ) : (
          <ul className="divide-y divide-kotta-border rounded-card bg-kotta-surface px-4">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={group.href}
                  className="flex min-h-[68px] items-center gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-control bg-kotta-bg text-[22px]"
                  >
                    {group.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-base font-semibold text-kotta-text">{group.name}</span>
                    <span className="text-[13px] text-kotta-muted">
                      {group.memberCount} {group.memberCount === 1 ? "pessoa" : "pessoas"}
                    </span>
                  </span>
                  <BalanceChip netCents={group.netCents} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
