"use client";

import { useActionState, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  addShoppingItemAction,
  createShoppingListAction,
  deleteShoppingItemAction,
  renameShoppingListAction,
  toggleShoppingItemAction,
  updateShoppingItemAction,
  uploadReceiptAction,
} from "@/app/actions/shopping";
import { Field, FormError } from "@/components/auth/field";
import { compressPhoto } from "@/components/receipt/compress-photo";
import { ItemMatchLine, MatchDecision } from "@/components/receipt/item-match";
import { decodeQrFromFile } from "@/components/receipt/qr-decoder";
import type { ApiReceiptItem, ApiShoppingItem } from "@/lib/api/types";
import type { FormState } from "@/lib/form";
import { receiptUploadPath, type ItemMatchState, type ReceiptUploadPath } from "@/lib/receipt";
import { MAX_QUANTITY, MAX_SHOPPING_NAME_LENGTH } from "@/lib/shopping";

const initialState: FormState = {};
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";
const textButton = `inline-flex min-h-11 items-center px-2 text-sm font-semibold hover:underline ${focus}`;

/** Botão de envio que pede confirmação antes (excluir lista, item, nota). */
export function ConfirmSubmit({
  message,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  message: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  function confirmFirst(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }
  return (
    <button type="submit" onClick={confirmFirst} aria-label={ariaLabel} className={className}>
      {children}
    </button>
  );
}

/** Cria (com groupId) ou renomeia (com listId) uma lista. */
export function ShoppingListNameForm({
  groupId,
  listId,
  defaultName = "",
}: {
  groupId?: string;
  listId?: string;
  defaultName?: string;
}) {
  const creating = Boolean(groupId);
  const [state, formAction, pending] = useActionState(
    creating ? createShoppingListAction : renameShoppingListAction,
    initialState,
  );
  const fieldId = creating ? `nova-lista-${groupId}` : `nome-lista-${listId}`;

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {creating ? <input type="hidden" name="groupId" value={groupId} /> : null}
      {listId ? <input type="hidden" name="listId" value={listId} /> : null}
      <FormError message={state.error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field
          id={fieldId}
          name="name"
          label={creating ? "Nova lista" : "Nome da lista"}
          placeholder="Ex.: Compra da semana"
          maxLength={MAX_SHOPPING_NAME_LENGTH}
          required
          defaultValue={state.values?.name ?? defaultName}
          className="min-w-0 flex-1"
        />
        <button type="submit" className="primary-action" disabled={pending}>
          {creating ? (pending ? "Criando…" : "Criar lista") : pending ? "Salvando…" : "Salvar nome"}
        </button>
      </div>
      {state.ok && !creating ? (
        <p role="status" className="text-[13px] text-kotta-primary">
          Nome salvo.
        </p>
      ) : null}
    </form>
  );
}

function QuantityField({ id, defaultValue }: { id: string; defaultValue?: string }) {
  return (
    <Field
      id={id}
      name="quantity"
      label="Qtd."
      type="number"
      inputMode="numeric"
      min={1}
      max={MAX_QUANTITY}
      step={1}
      required
      defaultValue={defaultValue}
      className="w-24 shrink-0"
    />
  );
}

export function AddShoppingItemForm({ listId }: { listId: string }) {
  const [state, formAction, pending] = useActionState(addShoppingItemAction, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="listId" value={listId} />
      <FormError message={state.error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <Field
            id="novo-item"
            name="name"
            label="Item"
            placeholder="Ex.: Arroz 5 kg"
            maxLength={MAX_SHOPPING_NAME_LENGTH}
            required
            defaultValue={state.values?.name}
            className="min-w-0 flex-1"
          />
          <QuantityField id="novo-item-qtd" defaultValue={state.values?.quantity ?? "1"} />
        </div>
        <button type="submit" className="primary-action" disabled={pending}>
          {pending ? "Adicionando…" : "Adicionar item"}
        </button>
      </div>
    </form>
  );
}

const ROW_TONE: Record<ItemMatchState, string> = {
  found: "bg-kotta-light-green",
  review: "bg-kotta-review-bg",
  missing: "",
  none: "",
};

/** Linha do item: marcar como comprado, editar e remover; com nota lida, mostra o que veio nela. */
export function ShoppingItemRow({
  item,
  readOnly,
  matchState = "none",
  invoiceItem,
}: {
  item: ApiShoppingItem;
  readOnly: boolean;
  matchState?: ItemMatchState;
  invoiceItem?: ApiReceiptItem | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await updateShoppingItemAction(prev, formData);
    if (result.ok) setEditing(false);
    return result;
  }, initialState);

  if (editing) {
    return (
      <form action={formAction} className="flex flex-col gap-3 p-4" noValidate>
        <input type="hidden" name="itemId" value={item.id} />
        <FormError message={state.error} />
        <div className="flex items-end gap-3">
          <Field
            id={`item-${item.id}`}
            name="name"
            label="Item"
            maxLength={MAX_SHOPPING_NAME_LENGTH}
            required
            defaultValue={state.values?.name ?? item.name}
            className="min-w-0 flex-1"
            autoFocus
          />
          <QuantityField id={`item-${item.id}-qtd`} defaultValue={state.values?.quantity ?? String(item.quantity)} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className={`${textButton} text-kotta-muted`}>
            Cancelar
          </button>
          <button type="submit" disabled={pending} className={`${textButton} text-kotta-primary`}>
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    );
  }

  const box = (
    <span
      aria-hidden="true"
      className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 ${
        item.completed ? "border-kotta-primary bg-kotta-primary text-white" : "border-kotta-border-strong bg-kotta-surface"
      }`}
    >
      {item.completed ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="size-4">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );

  return (
    <div className={`flex min-h-[68px] items-center gap-3 px-4 py-2 ${ROW_TONE[matchState]}`}>
      {readOnly ? (
        <span className="flex size-11 items-center justify-center">{box}</span>
      ) : (
        <form action={toggleShoppingItemAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="completed" value={String(!item.completed)} />
          <button
            type="submit"
            role="checkbox"
            aria-checked={item.completed}
            aria-label={`${item.name}, ${item.completed ? "comprado" : "pendente"}`}
            className={`flex size-11 items-center justify-center rounded-control ${focus}`}
          >
            {box}
          </button>
        </form>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-base font-semibold ${
            item.completed ? "text-kotta-muted line-through" : "text-kotta-text"
          }`}
        >
          {item.name}
        </p>
        <p className="text-[13px] text-kotta-muted">Quantidade: {item.quantity}</p>
        <ItemMatchLine state={matchState} invoiceItem={invoiceItem} />
        {matchState === "review" && item.match && !readOnly ? (
          <MatchDecision matchId={item.match.id} itemName={item.name} />
        ) : null}
      </div>
      {readOnly ? null : (
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Editar ${item.name}`}
            className={`${textButton} text-kotta-primary`}
          >
            Editar
          </button>
          <form action={deleteShoppingItemAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <ConfirmSubmit
              message={`Remover "${item.name}" da lista?`}
              aria-label={`Remover ${item.name}`}
              className={`${textButton} text-kotta-danger`}
            >
              Remover
            </ConfirmSubmit>
          </form>
        </div>
      )}
    </div>
  );
}

type QrSearch = "idle" | "searching" | ReceiptUploadPath;

const QR_SEARCH_STATUS: Record<Exclude<QrSearch, "idle">, string> = {
  searching: "Procurando QR code…",
  qr: "QR code encontrado, enviando…",
  "not-nfce": "Esse QR não parece de nota fiscal.",
  ocr: "Não achei o QR code, vou ler a nota pela imagem.",
};

/**
 * Imagem da nota (foto ou print): procura o QR no aparelho antes de subir.
 * QR de NFC-e vai pelo mesmo caminho da câmera, sem upload; sem QR, a imagem reduzida vai pro OCR da API.
 */
export function ReceiptUploadForm({
  listId,
  onQrDetected,
}: {
  listId: string;
  onQrDetected: (qrUrl: string) => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) formData.set("file", await compressPhoto(file));
    return uploadReceiptAction(prev, formData);
  }, initialState);
  const [hint, setHint] = useState<string | null>(null);
  const [search, setSearch] = useState<QrSearch>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  // Só vale o resultado do último arquivo escolhido.
  const searchId = useRef(0);
  const error = hint ?? state.error;
  const busy = pending || search === "searching" || search === "qr";

  async function searchQr(file: File) {
    const id = ++searchId.current;
    setSearch("searching");
    const text = await decodeQrFromFile(file);
    if (id !== searchId.current) return;
    const path = receiptUploadPath(text);
    setSearch(path);
    if (path === "qr" && text) onQrDetected(text);
    if (path === "ocr") formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="listId" value={listId} />
      <FormError message={error} />
      <div>
        <label htmlFor={`nota-${listId}`} className="block text-sm font-semibold text-kotta-text">
          Enviar imagem da nota
        </label>
        <input
          id={`nota-${listId}`}
          name="file"
          type="file"
          accept="image/*"
          required
          aria-describedby={`nota-${listId}-dica`}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            const isImage = Boolean(file?.type.startsWith("image/"));
            setHint(file && !isImage ? "Envie uma foto da nota." : null);
            if (file && isImage) {
              void searchQr(file);
            } else {
              searchId.current += 1;
              setSearch("idle");
            }
          }}
          className={`mt-2 block w-full rounded-control border border-kotta-border bg-kotta-surface p-2 text-sm text-kotta-text file:mr-3 file:min-h-10 file:rounded-[9px] file:border-0 file:bg-kotta-light-green file:px-4 file:font-semibold file:text-kotta-primary ${focus}`}
        />
        <p id={`nota-${listId}-dica`} className="mt-1.5 text-[13px] text-kotta-muted">
          Serve foto ou print. Se tiver QR code, lemos direto.
        </p>
      </div>
      {search !== "idle" ? (
        <p role="status" className="text-sm font-semibold text-kotta-text">
          {QR_SEARCH_STATUS[search]}
        </p>
      ) : null}
      <button type="submit" className="secondary-action" disabled={busy || Boolean(hint)}>
        {pending ? "Enviando imagem…" : search === "not-nfce" ? "Enviar pro OCR mesmo assim" : "Enviar imagem"}
      </button>
    </form>
  );
}
