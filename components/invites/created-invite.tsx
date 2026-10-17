"use client";

import type { CreatedInvite as CreatedInviteData } from "@/app/actions/invites";
import { CopyTextButton } from "@/components/app/copy-text-button";
import { QrCode } from "@/components/invites/qr-code";
import { formatInviteDate } from "@/lib/invites";

function usageText(invite: CreatedInviteData): string {
  const who = invite.maxUses === 1 ? "Uso único" : `Até ${invite.maxUses} pessoas`;
  return `${who}, vale até ${formatInviteDate(invite.expiresAt)}`;
}

/** Resultado do modal: o link só existe agora, então tudo para compartilhar fica aqui. */
export function CreatedInvite({ invite, title, onReset }: { invite: CreatedInviteData; title: string; onReset: () => void }) {
  // Só renderiza depois de um envio, no navegador: dá para olhar `navigator` direto.
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function share() {
    try {
      await navigator.share({ title, url: invite.url });
    } catch {
      // Cancelar a folha de compartilhamento também cai aqui; copiar e QR seguem na tela.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {invite.email ? (
        <p role="status" className="text-sm font-semibold text-kotta-text">
          {invite.emailSent
            ? `Convite enviado para ${invite.email}.`
            : "Não conseguimos enviar o e-mail. Compartilhe o link abaixo."}
        </p>
      ) : null}
      <div>
        <label htmlFor="convite-link" className="block text-sm font-semibold text-kotta-text">
          Link do convite
        </label>
        <input
          id="convite-link"
          readOnly
          value={invite.url}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-2 block min-h-12 w-full rounded-control border border-kotta-border bg-kotta-bg px-4 font-mono text-sm text-kotta-text outline-none focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20"
        />
        <p className="mt-1.5 text-[13px] text-kotta-muted">{usageText(invite)}</p>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <CopyTextButton
          text={invite.url}
          label="Copiar link"
          copiedLabel="Link copiado"
          failedMessage="Não deu para copiar. Selecione o link acima e copie."
        />
        {canShare ? (
          <button type="button" onClick={share} className="secondary-action">
            Compartilhar
          </button>
        ) : null}
      </div>
      <div className="flex justify-center">
        <QrCode value={invite.url} />
      </div>
      <p className="text-sm leading-6 text-kotta-muted">
        Este link só aparece agora. Depois, para compartilhar de novo, gere outro.
      </p>
      <button type="button" onClick={onReset} className="secondary-action self-start">
        Gerar outro
      </button>
    </div>
  );
}
