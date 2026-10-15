"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { updateAvatarAction, type FormState } from "@/app/actions/kotta";
import { AVATAR_TYPES, avatarFileProblem } from "@/lib/avatar";

const INPUT_ID = "avatar-file";
const noSubscribe = () => () => {};

/** Troca a foto de perfil. `children` é o avatar atual, renderizado no servidor. */
export function AvatarForm({ emailConfirmed, children }: { emailConfirmed: boolean; children: React.ReactNode }) {
  const [state, formAction, pending] = useActionState(updateAvatarAction, {} satisfies FormState);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Antes da hidratação o onChange não existe e a foto escolhida se perderia.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  // A prévia vive até a próxima escolha ou até sair da página.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  if (!emailConfirmed) {
    return (
      <div className="flex flex-col items-center gap-2">
        {children}
        <p className="text-[13px] text-kotta-muted">
          Para trocar a foto,{" "}
          <Link href="/confirme-seu-email" className="font-semibold text-kotta-primary underline underline-offset-2">
            confirme seu e-mail
          </Link>
          .
        </p>
      </div>
    );
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return; // seletor cancelado
    const problem = avatarFileProblem(file);
    if (problem) {
      setLocalError(problem);
      event.target.value = "";
      return;
    }
    setLocalError(null);
    setPreview(URL.createObjectURL(file));
    formRef.current?.requestSubmit();
  }

  const status = pending ? "Enviando…" : (localError ?? state.error ?? (state.ok ? "Foto atualizada." : ""));

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-3">
      <label htmlFor={INPUT_ID} className="cursor-pointer rounded-full">
        {pending && preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:)
          <img src={preview} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          children
        )}
      </label>
      <label
        className={`secondary-action has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-kotta-primary ${pending || !hydrated ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
      >
        {pending ? "Enviando…" : "Alterar foto"}
        <input
          id={INPUT_ID}
          type="file"
          name="file"
          accept={AVATAR_TYPES.join(",")}
          aria-label="Alterar foto de perfil"
          className="sr-only"
          disabled={pending || !hydrated}
          onChange={onPick}
        />
      </label>
      <p
        aria-live="polite"
        className={`text-[13px] ${localError || state.error ? "text-kotta-danger" : "text-kotta-primary"}`}
      >
        {status}
      </p>
    </form>
  );
}
