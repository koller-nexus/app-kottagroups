"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  getPasswordValidationMessage,
  isUsableResetToken,
  recoverPassword,
  type RecoveryState,
} from "@/lib/forget-password";

type ScreenState = "form" | "missing" | RecoveryState;

export function ForgetPasswordScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [state, setState] = useState<ScreenState>(
    isUsableResetToken(token) ? "form" : "missing",
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const visibleState: ScreenState = isUsableResetToken(token) ? state : "missing";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isUsableResetToken(token) || submitting) {
      return;
    }

    const validation = getPasswordValidationMessage(password, confirmation);
    if (validation) {
      setFieldError(validation);
      return;
    }

    setFieldError(undefined);
    setMessage(undefined);
    setSubmitting(true);

    try {
      const result = await recoverPassword(token, password);
      setState(result.state);
      setMessage(result.message);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setState("unexpected-error");
      setMessage("Não foi possível redefinir sua senha agora.");
    } finally {
      setSubmitting(false);
    }
  }

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
          {visibleState === "form" && (
            <form onSubmit={handleSubmit} noValidate>
              <h1 className="font-display text-4xl font-semibold leading-tight text-kotta-secondary">
                Nova senha
              </h1>
              <p className="mt-4 text-base leading-7 text-kotta-muted">
                Escolha uma senha de 8 a 72 caracteres para voltar a entrar no
                Kotta Groups.
              </p>

              <div className="mt-8 space-y-5">
                <Field
                  id="new-password"
                  label="Nova senha"
                  type="password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(value) => {
                    setPassword(value);
                    setFieldError(undefined);
                  }}
                />
                <Field
                  id="confirm-password"
                  label="Confirmar senha"
                  type="password"
                  value={confirmation}
                  autoComplete="new-password"
                  error={fieldError}
                  onChange={(value) => {
                    setConfirmation(value);
                    setFieldError(undefined);
                  }}
                />
              </div>

              <button
                type="submit"
                className="primary-action mt-8 w-full"
                disabled={submitting}
              >
                {submitting ? "Salvando…" : "Salvar senha"}
              </button>
            </form>
          )}

          {visibleState === "success" && (
            <div>
              <div
                className="mb-5 flex size-10 items-center justify-center rounded-full bg-kotta-light-green text-kotta-primary"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-kotta-secondary">
                Senha atualizada
              </h1>
              <p className="mt-4 text-base leading-7 text-kotta-muted">
                Abra o app Kotta Groups e entre com a nova senha.
              </p>
              <Link href="/" className="primary-action mt-8">
                Voltar ao início
              </Link>
            </div>
          )}

          {visibleState === "missing" && (
            <MessageState
              title="Link incompleto"
              description="Este link de recuperação não tem um token válido. Solicite um novo link no app para continuar."
            />
          )}

          {visibleState === "invalid" && (
            <MessageState
              title="Não foi possível redefinir"
              description={
                message ?? "Este link é inválido, expirou ou já foi utilizado."
              }
            />
          )}

          {visibleState === "unexpected-error" && (
            <MessageState
              title="Algo saiu do esperado"
              description={message ?? "Não foi possível redefinir sua senha agora."}
              action={
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => {
                    setMessage(undefined);
                    setState("form");
                  }}
                >
                  Tentar novamente
                </button>
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}

function Field({
  id,
  label,
  type,
  value,
  autoComplete,
  error,
  onChange,
}: {
  id: string;
  label: string;
  type: "password";
  value: string;
  autoComplete: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-kotta-text">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 min-h-12 w-full rounded-control border border-kotta-border bg-white px-4 text-base text-kotta-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-kotta-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MessageState({
  title,
  description,
  action = null,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div role="alert">
      <div className="mb-5 size-10 rounded-full bg-kotta-danger-bg" aria-hidden="true" />
      <h1 className="font-display text-4xl font-semibold leading-tight text-kotta-secondary">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-kotta-muted">{description}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
