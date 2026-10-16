"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { confirmEmailAction } from "@/app/actions/auth";
import type { ConfirmationOutcome } from "@/lib/confirm-email";

const TITLE_CLASS = "text-[34px] font-bold leading-tight tracking-tight text-kotta-text";
const TEXT_CLASS = "mt-4 max-w-md text-base leading-7 text-kotta-muted";
const SECONDARY_LINK_CLASS =
  "inline-flex min-h-11 items-center text-sm font-semibold text-kotta-muted hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

// O token só vale uma vez: uma segunda chamada (efeito rodando de novo, StrictMode) daria
// "link inválido". Cada tentativa reaproveita a mesma promessa.
const confirmations = new Map<string, Promise<ConfirmationOutcome>>();

function confirmOnce(token: string, attempt: number): Promise<ConfirmationOutcome> {
  const key = `${attempt}:${token}`;
  let promise = confirmations.get(key);
  if (!promise) {
    promise = confirmEmailAction(token);
    confirmations.set(key, promise);
  }
  return promise;
}

export function ConfirmEmailScreen() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  const [outcome, setOutcome] = useState<ConfirmationOutcome>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    confirmOnce(token, attempt)
      .then((result) => {
        if (active) setOutcome(result);
      })
      .catch(() => {
        if (active) setOutcome({ state: "unexpected-error", signedIn: false });
      });
    return () => {
      active = false;
    };
  }, [attempt, token]);

  if (!outcome) {
    return (
      <div role="status">
        <span className="mb-5 block size-10 animate-pulse rounded-full bg-kotta-light-green motion-reduce:animate-none" />
        <h1 className={TITLE_CLASS}>Confirmando seu e-mail</h1>
        <p className={TEXT_CLASS}>Só um instante. Estamos ativando sua conta.</p>
      </div>
    );
  }

  const { state, signedIn } = outcome;

  if (state === "success" || state === "already-confirmed") {
    return (
      <div aria-live="polite">
        <div
          className="mb-5 flex size-10 items-center justify-center rounded-full bg-kotta-light-green text-kotta-primary"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>
        <h1 className={TITLE_CLASS}>E-mail confirmado</h1>
        <p className={TEXT_CLASS}>
          {signedIn ? "Sua conta está pronta. Vamos aos seus grupos." : "Sua conta está pronta. Entre para ver seus grupos."}
        </p>
        <Link href={signedIn ? "/" : "/entrar?next=%2F"} className="primary-action mt-8">
          {signedIn ? "Continuar" : "Entrar"}
        </Link>
      </div>
    );
  }

  if (state === "unexpected-error") {
    return (
      <MessageState
        title="Algo saiu do esperado"
        description="Não foi possível confirmar seu e-mail agora. Tente de novo em instantes."
      >
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            setOutcome(undefined);
            setAttempt((current) => current + 1);
          }}
        >
          Tentar novamente
        </button>
      </MessageState>
    );
  }

  const resendHref = signedIn ? "/confirme-seu-email" : "/entrar?next=%2Fconfirme-seu-email";
  return (
    <MessageState
      title={state === "missing" ? "Link incompleto" : "Link inválido ou expirado"}
      description={
        state === "missing"
          ? "Este link de confirmação está incompleto. Peça um novo para continuar."
          : "O link vale 24 horas e só pode ser usado uma vez. Peça um novo."
      }
    >
      <div className="flex flex-col items-start gap-3">
        <Link href={resendHref} className="primary-action">
          Reenviar link
        </Link>
        <Link href="/" className={SECONDARY_LINK_CLASS}>
          Ir para o início
        </Link>
      </div>
    </MessageState>
  );
}

function MessageState({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div role="alert">
      <div className="mb-5 size-10 rounded-full bg-kotta-danger-bg" aria-hidden="true" />
      <h1 className={TITLE_CLASS}>{title}</h1>
      <p className={TEXT_CLASS}>{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
