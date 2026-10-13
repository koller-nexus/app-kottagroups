// Regras da nota fiscal (NFC-e) da lista de compras: chave de acesso, QR code, foto e marcações.
import type {
  ApiExtractionMethod,
  ApiInvoiceStatus,
  ApiReceiptItem,
  ApiReceiptMatch,
  ApiShoppingItem,
} from "@/lib/api/types";
import { formatBRL } from "./money.ts";

export const ACCESS_KEY_LENGTH = 44;
/** Modelo 65 = NFC-e (cupom do mercado); 55 é NF-e e não entra. */
export const NFCE_MODEL = "65";
export const MAX_PHOTO_SIDE_PX = 1600;
export const PHOTO_JPEG_QUALITY = 0.8;
export const RECEIPT_POLL_FIRST_MS = 2000;
export const RECEIPT_POLL_MAX_MS = 5000;
export const RECEIPT_POLL_TIMEOUT_MS = 120_000;
/** Teto da busca de QR na imagem enviada; estourou, a imagem segue pro OCR. */
export const QR_SEARCH_DEADLINE_MS = 1500;
const POLL_GROWTH = 1.25;

export type ItemMatchState = "found" | "review" | "missing" | "none";

function digitsOf(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Dígito verificador módulo 11 da SEFAZ: pesos 2 a 9 da direita para a esquerda. */
function checkDigit(base: string): number {
  let sum = 0;
  let weight = 2;
  for (let i = base.length - 1; i >= 0; i -= 1) {
    sum += Number(base[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Chave de NFC-e só com dígitos, ou null se o tamanho, o modelo ou o DV não batem. */
export function normalizeAccessKey(raw: string): string | null {
  const digits = digitsOf(raw);
  if (digits.length !== ACCESS_KEY_LENGTH) return null;
  if (digits.slice(20, 22) !== NFCE_MODEL) return null;
  if (checkDigit(digits.slice(0, -1)) !== Number(digits.at(-1))) return null;
  return digits;
}

export function accessKeyProblem(raw: string): string | null {
  if (digitsOf(raw).length !== ACCESS_KEY_LENGTH) return "A chave tem 44 números.";
  if (!normalizeAccessKey(raw)) return "Confira a chave: algum número não bate.";
  return null;
}

/** "1234 5678 9012 …": só dígitos, no máximo 44, em blocos de 4. */
export function formatAccessKey(raw: string): string {
  const digits = digitsOf(raw).slice(0, ACCESS_KEY_LENGTH);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** O QR da NFC-e é uma URL da SEFAZ com `p=<chave>|versão|ambiente|…`. */
export function accessKeyFromQrUrl(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  const p = url.searchParams.get("p");
  if (!p) return null;
  return normalizeAccessKey(p.split("|")[0]);
}

/** Caminho da imagem enviada: QR de NFC-e evita o OCR; outro QR pede confirmação. */
export type ReceiptUploadPath = "qr" | "not-nfce" | "ocr";

export function receiptUploadPath(qrText: string | null): ReceiptUploadPath {
  if (qrText === null) return "ocr";
  return accessKeyFromQrUrl(qrText) ? "qr" : "not-nfce";
}

/** Tamanho que cabe em `max` no lado maior, sem aumentar a imagem. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function nextPollDelay(attempt: number): number {
  return Math.min(RECEIPT_POLL_FIRST_MS * POLL_GROWTH ** attempt, RECEIPT_POLL_MAX_MS);
}

/** Nota lida: os itens da lista já podem ser pintados. */
export function isReceiptProcessed(status: ApiInvoiceStatus | null | undefined): boolean {
  return status === "done" || status === "needs_review";
}

export function itemMatchState(item: Pick<ApiShoppingItem, "match">, processed: boolean): ItemMatchState {
  if (item.match?.status === "needs_review") return "review";
  if (item.match) return "found";
  return processed ? "missing" : "none";
}

export function matchSummary(items: Pick<ApiShoppingItem, "match">[]): { found: number; review: number; total: number } {
  let found = 0;
  let review = 0;
  for (const item of items) {
    const state = itemMatchState(item, true);
    if (state === "found") found += 1;
    if (state === "review") review += 1;
  }
  return { found, review, total: items.length };
}

/** "12 de 15 itens encontrados na nota · 2 para conferir". */
export function matchSummaryLabel({ found, review, total }: { found: number; review: number; total: number }): string {
  const noun = total === 1 ? "item encontrado" : "itens encontrados";
  const base = `${found} de ${total} ${noun} na nota`;
  return review > 0 ? `${base} · ${review} para conferir` : base;
}

/** Itens da nota que não correspondem a nada da lista. */
export function extraInvoiceItems(receipt: { items: ApiReceiptItem[]; matches: ApiReceiptMatch[] }): ApiReceiptItem[] {
  const used = new Set(receipt.matches.flatMap((match) => (match.invoiceItem ? [match.invoiceItem.index] : [])));
  return receipt.items.filter((line) => !used.has(line.index));
}

/** "2x LEITE INTEG 1L · R$ 10,98". */
export function invoiceLineLabel(line: ApiReceiptItem): string {
  return `${line.quantity.toLocaleString("pt-BR")}x ${line.description} · ${formatBRL(line.totalCents)}`;
}

export function extractionMethodLabel(method: ApiExtractionMethod | null): string | null {
  if (method === "qrcode") return "via QR code";
  if (method === "ocr") return "via foto";
  return null;
}
