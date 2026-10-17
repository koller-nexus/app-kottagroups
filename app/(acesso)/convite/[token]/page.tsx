import type { Metadata } from "next";
import Link from "next/link";
import { acceptInviteAction } from "@/app/actions/invites";
import { logoutAction } from "@/app/actions/auth";
import { PendingButton } from "@/components/app/pending-button";
import { FormError } from "@/components/auth/field";
import { ApiError, friendlyMessage } from "@/lib/api/errors";
import { getMe, previewInvite } from "@/lib/api/kotta";
import { getSessionToken } from "@/lib/api/session";
import type { ApiInvitePreview } from "@/lib/api/types";
import { formatInviteDate, inviteReturnPath, invitePageState, isInviteTokenShape } from "@/lib/invites";

// O token na URL é um segredo: fora dos buscadores e sem Referer para outros sites.
export const metadata: Metadata = {
  title: "Convite — Kotta Groups",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const TITLE_CLASS = "text-[34px] font-bold leading-tight tracking-tight text-kotta-text";
const TEXT_LINK_CLASS =
  "inline-flex min-h-11 items-center justify-center text-sm font-semibold text-kotta-muted hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

async function loadPreview(token: string): Promise<{ preview?: ApiInvitePreview; errorCode?: string }> {
  try {
    return { preview: await previewInvite(token) };
  } catch (error) {
    if (error instanceof ApiError) return { errorCode: error.code };
    throw error;
  }
}

export default async function ConvitePage({ params, searchParams }: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const { erro } = await searchParams;
  const erroCode = typeof erro === "string" ? erro : undefined;
  const tokenOk = isInviteTokenShape(token);
  const hasSession = Boolean(await getSessionToken());

  const [{ preview, errorCode }, me] = await Promise.all([
    tokenOk ? loadPreview(token) : Promise.resolve({ preview: undefined, errorCode: undefined }),
    tokenOk && hasSession ? getMe() : Promise.resolve(undefined),
  ]);
  const state = invitePageState({ tokenOk, previewErrorCode: errorCode, hasSession, erro: erroCode });

  if (state === "invalid") return <InvalidInvite hasSession={hasSession} />;
  if (state === "error" || !preview) {
    return (
      <>
        <h1 className={TITLE_CLASS}>Não deu para abrir o convite</h1>
        <p className="mt-4 text-base leading-7 text-kotta-muted">{friendlyMessage(errorCode ?? "SERVICE_UNAVAILABLE")}</p>
        <Link href={inviteReturnPath(token)} className="primary-action mt-8 w-full">
          Tentar de novo
        </Link>
      </>
    );
  }

  const next = inviteReturnPath(token);
  const nextQuery = new URLSearchParams({ next }).toString();

  return (
    <>
      <InviteSummary preview={preview} />
      {state === "guest" ? (
        <div className="mt-8 flex flex-col gap-3">
          <p className="text-sm leading-6 text-kotta-muted">Para entrar no grupo, crie sua conta ou entre com a que você já tem.</p>
          <Link href={`/cadastrar?${nextQuery}`} className="primary-action w-full">
            Criar conta
          </Link>
          <Link href={`/entrar?${nextQuery}`} className="secondary-action w-full">
            Já tenho conta
          </Link>
        </div>
      ) : null}
      {state === "member-ready" ? (
        <form action={acceptInviteAction} className="mt-8 flex flex-col gap-3">
          {erroCode ? <FormError message={friendlyMessage(erroCode)} /> : null}
          <input type="hidden" name="token" value={token} />
          <p className="text-sm text-kotta-muted">
            Entrando como <span className="font-semibold text-kotta-text">{me?.email}</span>
          </p>
          <PendingButton pendingLabel="Entrando…" className="primary-action w-full">
            Entrar no grupo
          </PendingButton>
        </form>
      ) : null}
      {state === "email-mismatch" ? (
        <form action={logoutAction} className="mt-8 flex flex-col gap-3">
          <FormError message={`${friendlyMessage("INVITE_EMAIL_MISMATCH")} Você está como ${me?.email ?? "outra conta"}.`} />
          <input type="hidden" name="next" value={next} />
          <PendingButton pendingLabel="Saindo…" className="primary-action w-full">
            Sair e entrar com outra conta
          </PendingButton>
        </form>
      ) : null}
    </>
  );
}

function InviteSummary({ preview }: { preview: ApiInvitePreview }) {
  return (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-card bg-kotta-light-green text-4xl"
      >
        {preview.group.emoji}
      </span>
      <div className="min-w-0">
        <p className="text-base text-kotta-muted">{preview.inviterName} convidou você para</p>
        <h1 className={`${TITLE_CLASS} break-words`}>{preview.group.name}</h1>
        <p className="mt-2 text-sm text-kotta-muted">Convite válido até {formatInviteDate(preview.expiresAt)}</p>
      </div>
    </div>
  );
}

function InvalidInvite({ hasSession }: { hasSession: boolean }) {
  return (
    <>
      <h1 className={TITLE_CLASS}>Este convite não vale mais</h1>
      <p className="mt-4 text-base leading-7 text-kotta-muted">
        Ele pode ter expirado, já ter sido usado ou ter sido cancelado. Peça um novo link a quem convidou você.
      </p>
      {hasSession ? (
        <Link href="/" className="primary-action mt-8 w-full">
          Ir para o Painel
        </Link>
      ) : (
        <div className="mt-8 flex flex-col gap-1">
          <Link href="/entrar" className="primary-action w-full">
            Entrar
          </Link>
          <Link href="/cadastrar" className={TEXT_LINK_CLASS}>
            Criar conta
          </Link>
        </div>
      )}
    </>
  );
}
