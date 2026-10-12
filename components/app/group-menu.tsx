import Link from "next/link";
import { archiveGroupAction, unarchiveGroupAction } from "@/app/actions/groups";
import type { ApiMemberRole } from "@/lib/api/types";
import { canDeleteGroup, canManageGroup } from "@/lib/permissions";

const itemClass =
  "flex min-h-11 w-full items-center rounded-control px-3 text-left text-sm font-semibold hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

/** Menu "Opções" do grupo; cada item aparece conforme o papel de quem vê. */
export function GroupMenu({
  group,
  role,
}: {
  group: { id: string; archived: boolean };
  role: ApiMemberRole | undefined;
}) {
  const manage = canManageGroup(role);
  const remove = canDeleteGroup(role);
  if (!manage && !remove) return null;

  return (
    <details className="relative">
      <summary className="secondary-action cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        Opções
      </summary>
      <div className="absolute left-0 z-10 mt-2 flex w-60 flex-col rounded-card border border-kotta-border bg-kotta-surface p-2 sm:right-0 sm:left-auto">
        {manage ? (
          <Link href={`/grupos/${group.id}/editar`} className={`${itemClass} text-kotta-text`}>
            Editar grupo
          </Link>
        ) : null}
        <Link href={`/grupos/${group.id}/membros`} className={`${itemClass} text-kotta-text`}>
          Gerenciar membros
        </Link>
        {manage ? (
          <form action={group.archived ? unarchiveGroupAction : archiveGroupAction}>
            <input type="hidden" name="groupId" value={group.id} />
            <button type="submit" className={`${itemClass} text-kotta-text`}>
              {group.archived ? "Restaurar grupo" : "Arquivar grupo"}
            </button>
          </form>
        ) : null}
        {remove ? (
          <Link href={`/grupos/${group.id}?confirmar=excluir`} className={`${itemClass} text-kotta-danger`}>
            Excluir grupo
          </Link>
        ) : null}
      </div>
    </details>
  );
}
