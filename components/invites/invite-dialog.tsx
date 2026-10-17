"use client";

import { useActionState, useRef, useState } from "react";
import { createInviteAction, type InviteFormState } from "@/app/actions/invites";
import { Field, FormError } from "@/components/auth/field";
import { CreatedInvite } from "@/components/invites/created-invite";
import { INVITE_DEFAULT_EXPIRY_HOURS, INVITE_EXPIRY_OPTIONS, INVITE_MAX_USES_MAX, INVITE_MAX_USES_MIN } from "@/lib/invites";

const initialState: InviteFormState = {};

const CONTROL_CLASS =
  "mt-2 block min-h-12 w-full rounded-control border border-kotta-border bg-kotta-surface px-4 text-base text-kotta-text outline-none focus:border-kotta-primary focus:ring-2 focus:ring-kotta-primary/20";
const CLOSE_CLASS =
  "inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-kotta-muted hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

export function InviteDialog({ groupId, groupName }: { groupId: string; groupName: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(createInviteAction, initialState);
  // "Gerar outro" esconde o resultado sem um novo envio.
  const [dismissed, setDismissed] = useState<InviteFormState | null>(null);
  const [email, setEmail] = useState("");
  const [audience, setAudience] = useState<"one" | "many">("one");
  const created = state.created && state !== dismissed ? state.created : undefined;
  const errors = state.fieldErrors ?? {};
  const audienceLocked = email.trim() !== "";

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => dialogRef.current?.showModal()} className="secondary-action">
        Convidar
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="convidar-titulo"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          // Toque no fundo (fora do cartão) fecha.
          if (event.target === event.currentTarget) close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-0 text-kotta-text backdrop:bg-kotta-secondary/60"
      >
        <div className="max-h-[85dvh] overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="convidar-titulo" className="text-xl font-bold text-kotta-text">
              Convidar para {groupName}
            </h2>
            <button type="button" onClick={close} className={CLOSE_CLASS}>
              Fechar
            </button>
          </div>
          <div className="mt-5">
            {created ? (
              <CreatedInvite invite={created} title={`Convite para ${groupName}`} onReset={() => setDismissed(state)} />
            ) : (
              <form action={formAction} className="flex flex-col gap-5" noValidate>
                <FormError message={state.error} />
                <input type="hidden" name="groupId" value={groupId} />
                <p className="text-sm leading-6 text-kotta-muted">
                  Gere um link para mandar no WhatsApp ou mostrar o QR code. Se preferir, informe o e-mail da pessoa.
                </p>
                <Field
                  id="convite-email"
                  name="email"
                  type="email"
                  label="E-mail (opcional)"
                  autoComplete="off"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={errors.email}
                />
                <fieldset>
                  <legend className="text-sm font-semibold text-kotta-text">Quem pode usar</legend>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    <label className="inline-flex min-h-11 items-center gap-2 text-base">
                      <input type="radio" name="audience" value="one" checked={audienceLocked || audience === "one"} onChange={() => setAudience("one")} />
                      Uma pessoa
                    </label>
                    <label className="inline-flex min-h-11 items-center gap-2 text-base">
                      <input
                        type="radio"
                        name="audience"
                        value="many"
                        disabled={audienceLocked}
                        checked={!audienceLocked && audience === "many"}
                        onChange={() => setAudience("many")}
                      />
                      Várias pessoas
                    </label>
                  </div>
                  {audienceLocked ? <p className="mt-1.5 text-[13px] text-kotta-muted">Convite por e-mail vale para uma pessoa.</p> : null}
                </fieldset>
                {!audienceLocked && audience === "many" ? (
                  <Field
                    id="convite-max"
                    name="maxUses"
                    type="number"
                    inputMode="numeric"
                    label="Até quantas pessoas"
                    min={INVITE_MAX_USES_MIN}
                    max={INVITE_MAX_USES_MAX}
                    defaultValue={state.values?.maxUses || "5"}
                    error={errors.maxUses}
                  />
                ) : null}
                <div>
                  <label htmlFor="convite-validade" className="block text-sm font-semibold text-kotta-text">
                    Validade
                  </label>
                  <select
                    id="convite-validade"
                    name="expiresInHours"
                    defaultValue={state.values?.expiresInHours || String(INVITE_DEFAULT_EXPIRY_HOURS)}
                    aria-describedby={errors.expiresInHours ? "convite-validade-error" : undefined}
                    className={CONTROL_CLASS}
                  >
                    {INVITE_EXPIRY_OPTIONS.map((option) => (
                      <option key={option.hours} value={option.hours}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.expiresInHours ? (
                    <p id="convite-validade-error" className="mt-1.5 text-[13px] text-kotta-danger">
                      {errors.expiresInHours}
                    </p>
                  ) : null}
                </div>
                <button type="submit" className="primary-action w-full" disabled={pending}>
                  {pending ? "Gerando…" : audienceLocked ? "Enviar convite" : "Gerar link"}
                </button>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
