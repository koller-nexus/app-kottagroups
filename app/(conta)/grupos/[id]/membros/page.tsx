import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { addMemberAction, promoteMemberAction, removeMemberAction } from "@/app/actions/groups";
import { FormError } from "@/components/auth/field";
import { Avatar } from "@/components/app/avatar";
import { Page, SectionLabel } from "@/components/app/page-header";
import { InviteDialog } from "@/components/invites/invite-dialog";
import { InviteList, InviteListSkeleton } from "@/components/invites/invite-list";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { getGroup, getMe, listGroupDetails } from "@/lib/api/kotta";
import type { ApiMemberRole } from "@/lib/api/types";
import { canInviteMembers, canManageGroup, canPromoteMember } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Membros — Kotta Groups",
};

const ROLE_LABEL: Record<ApiMemberRole, string> = { owner: "Dono", admin: "Admin", member: "Membro" };

const rowButtonClass =
  "min-h-11 rounded-control px-3 text-sm font-semibold hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

export default async function MembrosPage({ params, searchParams }: PageProps<"/grupos/[id]/membros">) {
  const { id } = await params;
  const { erro, aviso } = await searchParams;
  const [me, group, myGroups] = await Promise.all([
    getMe(),
    getGroup(id).catch((error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
      throw error;
    }),
    listGroupDetails(),
  ]);

  const myRole = group.members.find((m) => m.id === me.id)?.role;
  const manage = canManageGroup(myRole);
  const promote = canPromoteMember(myRole);
  const invite = canInviteMembers(myRole) && !group.archived;

  // Sem busca de usuários na API: dá para adicionar quem está nos seus outros grupos.
  const inGroup = new Set(group.members.map((m) => m.id));
  const candidates = new Map<string, string>();
  for (const other of myGroups) {
    for (const person of other.members) {
      if (!inGroup.has(person.id)) candidates.set(person.id, person.name);
    }
  }
  const toAdd = [...candidates]
    .map(([personId, name]) => ({ id: personId, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <Page
      width="reading"
      back={{ href: `/grupos/${group.id}`, label: group.name }}
      title="Membros"
      description={`${group.members.length} ${group.members.length === 1 ? "pessoa" : "pessoas"} em ${group.name}`}
      actions={invite ? <InviteDialog groupId={group.id} groupName={group.name} /> : undefined}
    >
      {aviso === "convite-revogado" ? (
        <p role="status" className="rounded-control border border-kotta-border bg-kotta-surface px-4 py-3 text-sm font-semibold text-kotta-text">
          Convite revogado.
        </p>
      ) : null}
      {typeof erro === "string" && erro ? (
        <div>
          <FormError message={friendlyMessage(erro)} />
        </div>
      ) : null}

      <ul className="divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface">
        {group.members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Avatar person={member} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-kotta-text">
                {member.id === me.id ? `${member.name} (você)` : member.name}
              </p>
              <p className="text-[13px] text-kotta-muted">{ROLE_LABEL[member.role]}</p>
            </div>
            {promote && member.role === "member" ? (
              <form action={promoteMemberAction}>
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="userId" value={member.id} />
                <button
                  type="submit"
                  aria-label={`Promover ${member.name} a admin`}
                  className={`${rowButtonClass} text-kotta-primary`}
                >
                  Promover a admin
                </button>
              </form>
            ) : null}
            {manage && member.role !== "owner" ? (
              <form action={removeMemberAction}>
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="userId" value={member.id} />
                <button
                  type="submit"
                  aria-label={`Remover ${member.name} do grupo`}
                  className={`${rowButtonClass} text-kotta-danger`}
                >
                  Remover
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {invite ? (
        <section aria-labelledby="convites">
          <SectionLabel id="convites">Convites</SectionLabel>
          <Suspense fallback={<InviteListSkeleton />}>
            <InviteList groupId={group.id} members={group.members} />
          </Suspense>
        </section>
      ) : null}

      {manage ? (
        <section aria-labelledby="adicionar">
          <SectionLabel id="adicionar">Adicionar</SectionLabel>
          {toAdd.length === 0 ? (
            <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
              Todo mundo dos seus outros grupos já está aqui. Quem participa de algum grupo com você aparece nesta
              lista.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-kotta-muted">Pessoas dos seus outros grupos.</p>
              <ul className="divide-y divide-kotta-border rounded-card border border-kotta-border bg-kotta-surface">
                {toAdd.map((person) => (
                  <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar person={person} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-kotta-text">
                      {person.name}
                    </span>
                    <form action={addMemberAction}>
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="userId" value={person.id} />
                      <button
                        type="submit"
                        aria-label={`Adicionar ${person.name}`}
                        className={`${rowButtonClass} text-kotta-primary`}
                      >
                        Adicionar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : null}
    </Page>
  );
}
