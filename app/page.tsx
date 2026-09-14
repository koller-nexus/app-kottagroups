import Image from "next/image";
import { GroupRow } from "@/components/landing/group-row";
import { MonthSpendBlock } from "@/components/landing/month-spend";
import { SettlementRow } from "@/components/landing/settlement-row";
import { StatCard } from "@/components/landing/stat-card";
import { StoreBadge } from "@/components/landing/store-badge";
import { landingSnapshot } from "@/lib/demo-landing";
import { formatBRL } from "@/lib/money";

export default function Home() {
  const { tagline, balances, monthSpend, settlements, groups, storeBadges } =
    landingSnapshot;
  const netPositive = balances.netCents >= 0;
  const netCaption = netPositive ? "a receber no total" : "a pagar no total";

  return (
    <div className="flex flex-1 justify-center bg-kotta-bg">
      <main className="w-full max-w-5xl px-5 py-8 pb-16 sm:px-8">
        <header className="flex flex-col gap-4 py-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
              <h1 className="flex min-w-0 items-center gap-2.5 font-display text-[28px] font-bold leading-none text-kotta-primary sm:gap-3 sm:text-[36px]">
                <Image
                  src="/kotta-app-icon-green-nobg.png"
                  alt=""
                  width={485}
                  height={448}
                  className="size-9 shrink-0 object-contain sm:size-10"
                  priority
                  unoptimized
                />
                Kotta Groups
              </h1>
              <p className="shrink-0 font-mono text-[11px] font-medium text-kotta-primary sm:hidden">
                Em breve
              </p>
            </div>
            <p className="mt-3 max-w-xl text-[15px] text-kotta-muted sm:mt-4 sm:text-base">
              {tagline}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[340px] sm:items-end">
            <p className="hidden font-mono text-[11px] font-medium text-kotta-primary sm:block">
              Em breve
            </p>
            <div className="grid w-full grid-cols-2 gap-3">
              {storeBadges.map((badge) => (
                <StoreBadge key={badge.store} store={badge.store} />
              ))}
            </div>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:grid-cols-4 sm:gap-6">
          <StatCard
            label="SEU SALDO"
            value={formatBRL(Math.abs(balances.netCents))}
            caption={netCaption}
            valueClassName={
              netPositive ? "text-kotta-primary" : "text-kotta-danger"
            }
          />
          <StatCard
            label="VOCÊ RECEBE"
            value={formatBRL(balances.receivesCents)}
            caption="em todos os grupos"
            valueClassName="text-kotta-primary"
          />
          <StatCard
            label="VOCÊ DEVE"
            value={formatBRL(balances.owesCents)}
            caption="em todos os grupos"
            valueClassName="text-kotta-danger"
          />
          <StatCard
            label="GRUPOS"
            value={String(balances.groupCount)}
            caption="ativos com você"
          />
        </div>

        <MonthSpendBlock monthSpend={monthSpend} />

        <h2 className="mt-10 mb-4 font-mono text-xs font-medium tracking-widest text-kotta-muted sm:mt-12">
          ÚLTIMAS QUITAÇÕES
        </h2>
        {settlements.length === 0 ? (
          <p className="text-[13px] text-kotta-muted">
            Nenhuma quitação pendente por aqui.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {settlements.map((settlement) => (
              <SettlementRow key={settlement.id} settlement={settlement} />
            ))}
          </div>
        )}

        <h2 className="mt-10 mb-4 font-mono text-xs font-medium tracking-widest text-kotta-muted sm:mt-12">
          SEUS GRUPOS
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {groups.map((group) => (
            <GroupRow key={group.id} group={group} />
          ))}
        </div>
      </main>
    </div>
  );
}
