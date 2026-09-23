"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  confirmEmail,
  isUsableConfirmationToken,
  type ConfirmationResult,
} from "@/lib/confirm-email";

type ScreenState = "loading" | "missing" | ConfirmationResult["state"];

export function ConfirmEmailScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [state, setState] = useState<ScreenState>("loading");
  const [message, setMessage] = useState<string>();
  const [expired, setExpired] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const visibleState: ScreenState = isUsableConfirmationToken(token)
    ? state
    : "missing";

  useEffect(() => {
    if (!isUsableConfirmationToken(token)) {
      return;
    }

    const controller = new AbortController();

    confirmEmail(token, controller.signal)
      .then((result) => {
        setState(result.state);
        setMessage(result.message);
        setExpired(result.expired ?? false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState("unexpected-error");
        setMessage("Não foi possível confirmar seu e-mail agora.");
        setExpired(false);
      });

    return () => controller.abort();
  }, [attempt, token]);

  const retry = () => {
    setMessage(undefined);
    setExpired(false);
    setState("loading");
    setAttempt((current) => current + 1);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-kotta-bg px-5 py-10 sm:px-8">
      <section className="w-full max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-7 shadow-[0_20px_60px_rgba(26,92,56,0.08)] sm:p-10">
        <Link
          href="/"
          className="font-display text-xl font-bold text-kotta-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-primary"
        >
          Kotta Groups
        </Link>

        <div className="mt-12" aria-live="polite">
          {visibleState === "loading" && (
            <div role="status">
              <span className="mb-5 block size-10 animate-pulse rounded-full bg-kotta-light-green" />
              <h1 className="font-display text-4xl font-semibold leading-tight text-kotta-secondary">
                Confirmando seu e-mail
              </h1>
              <p className="mt-4 text-base leading-7 text-kotta-muted">
                Só um instante. Estamos ativando sua conta.
              </p>
            </div>
          )}

          {visibleState === "success" && (
            <div>
              <div className="mb-5 flex size-10 items-center justify-center rounded-full bg-kotta-light-green text-kotta-primary" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-kotta-secondary">
                E-mail confirmado
              </h1>
              <p className="mt-4 text-base leading-7 text-kotta-muted">
                Sua conta está pronta. Entre para começar a organizar seus grupos.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-control bg-kotta-primary px-6 font-semibold text-white transition-colors hover:bg-kotta-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-primary"
              >
                Ir para o login
              </Link>
            </div>
          )}

          {visibleState === "missing" && (
            <MessageState
              title="Link incompleto"
              description="Este link de confirmação não tem um token válido. Solicite um novo link para continuar."
              action={null}
            />
          )}

          {visibleState === "invalid" && (
            <MessageState
              title="Não foi possível confirmar"
              description={message ?? "Este link é inválido, expirou ou já foi utilizado."}
              action={expired ? null : <LinkAction href="/login" label="Voltar para o login" />}
            />
          )}

          {visibleState === "unexpected-error" && (
            <MessageState
              title="Algo saiu do esperado"
              description={message ?? "Não foi possível confirmar seu e-mail agora."}
              action={<button onClick={retry} className="primary-action">Tentar novamente</button>}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function MessageState({
  title,
  description,
  action = <LinkAction href="/login" label="Voltar para o login" />,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div role="alert">
      <div className="mb-5 size-10 rounded-full bg-kotta-danger-bg" aria-hidden="true" />
      <h1 className="font-display text-4xl font-semibold leading-tight text-kotta-secondary">{title}</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-kotta-muted">{description}</p>
      <div className="mt-8">{action}</div>
    </div>
  );
}

function LinkAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="primary-action"
    >
      {label}
    </Link>
  );
}
