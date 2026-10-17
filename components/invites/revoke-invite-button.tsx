"use client";

import { revokeInviteAction } from "@/app/actions/invites";

export function RevokeInviteButton({ groupId, inviteId, target }: { groupId: string; inviteId: string; target: string }) {
  return (
    <form
      action={revokeInviteAction}
      onSubmit={(event) => {
        if (!window.confirm("Revogar este convite? O link deixa de funcionar na hora.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="inviteId" value={inviteId} />
      <button
        type="submit"
        aria-label={`Revogar convite ${target}`}
        className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-kotta-danger hover:bg-kotta-danger-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-danger"
      >
        Revogar
      </button>
    </form>
  );
}
