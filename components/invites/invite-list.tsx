import Link from "next/link";
import { RevokeInviteButton } from "@/components/invites/revoke-invite-button";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { listGroupInvites } from "@/lib/api/kotta";
import type { ApiGroupInvite, CursorPage } from "@/lib/api/types";
import { formatInviteDate, INVITE_LIST_LIMIT, splitInvites, type InviteRow } from "@/lib/invites";

const LIST_CLASS = "divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface";

/** Convites do grupo (dono/admin). Falha aqui não derruba a página de Membros. */
export async function InviteList({ groupId, members }: { groupId: string; members: { id: string; name: string }[] }) {
  let page: CursorPage<ApiGroupInvite>;
  try {
    page = await listGroupInvites(groupId);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <div role="alert" className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
        <p>Não deu para carregar os convites. {friendlyMessage(error.code)}</p>
        <Link href={`/grupos/${groupId}/membros`} className="secondary-action mt-3">
          Tentar de novo
        </Link>
      </div>
    );
  }

  if (page.items.length === 0) {
    return (
      <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
        Nenhum convite ainda. Use “Convidar” para gerar o primeiro link.
      </p>
    );
  }

  const { pending, closed } = splitInvites(page.items, new Map(members.map((m) => [m.id, m.name])));
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-kotta-muted">
        O link de um convite só aparece quando ele é criado. Para compartilhar de novo, gere outro.
      </p>
      {pending.length > 0 ? (
        <InviteGroup title="Pendentes">
          {pending.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <InviteDetails row={row} detail={`${row.uses}/${row.maxUses} usos, vale até ${formatInviteDate(row.expiresAt)}`} />
              <RevokeInviteButton groupId={groupId} inviteId={row.id} target={row.target} />
            </li>
          ))}
        </InviteGroup>
      ) : null}
      {closed.length > 0 ? (
        <InviteGroup title="Encerrados">
          {closed.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <InviteDetails row={row} detail={`${row.statusLabel}, criado em ${formatInviteDate(row.createdAt)}`} />
            </li>
          ))}
        </InviteGroup>
      ) : null}
      {page.hasMore ? <p className="text-[13px] text-kotta-muted">Mostrando os {INVITE_LIST_LIMIT} convites mais recentes.</p> : null}
    </div>
  );
}

function InviteGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-kotta-text">{title}</h3>
      <ul className={LIST_CLASS}>{children}</ul>
    </div>
  );
}

function InviteDetails({ row, detail }: { row: InviteRow; detail: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-kotta-text">{row.target}</p>
      <p className="text-[13px] text-kotta-muted">
        Por {row.creatorName}. {detail}
      </p>
    </div>
  );
}

export function InviteListSkeleton() {
  return (
    <div aria-hidden="true" className={`${LIST_CLASS} p-4`}>
      <div className="h-4 w-1/2 rounded-control bg-kotta-overlay motion-safe:animate-pulse" />
      <div className="mt-3 h-3 w-3/4 rounded-control bg-kotta-overlay motion-safe:animate-pulse" />
    </div>
  );
}
