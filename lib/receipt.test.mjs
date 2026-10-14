import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accessKeyFromQrUrl,
  accessKeyProblem,
  canRetryReceipt,
  extraInvoiceItems,
  extractionMethodLabel,
  fitWithin,
  formatAccessKey,
  invoiceLineLabel,
  itemMatchState,
  readingJustFinished,
  readingMessage,
  matchSummary,
  matchSummaryLabel,
  nextPollDelay,
  normalizeAccessKey,
  receiptUploadPath,
  resolutionPathLabel,
  retriesLeftLabel,
} from "./receipt.ts";

// Monta uma chave válida a partir dos 43 primeiros dígitos (mesma regra do DV da SEFAZ).
function withCheckDigit(base) {
  let sum = 0;
  let weight = 2;
  for (let i = base.length - 1; i >= 0; i -= 1) {
    sum += Number(base[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  return base + String(rest < 2 ? 0 : 11 - rest);
}

// UF 35, 2026-10, CNPJ, modelo 65, série 001, número, emissão 1, código.
const NFCE_KEY = withCheckDigit("35261012345678000195" + "65" + "001" + "000012345" + "1" + "12345678");
const NFE_KEY = withCheckDigit("35261012345678000195" + "55" + "001" + "000012345" + "1" + "12345678");
const BAD_DV_KEY = NFCE_KEY.slice(0, 43) + String((Number(NFCE_KEY[43]) + 1) % 10);

test("chave: 44 dígitos, modelo 65 e dígito verificador", () => {
  assert.equal(NFCE_KEY.length, 44);
  assert.equal(normalizeAccessKey(NFCE_KEY), NFCE_KEY);
  assert.equal(normalizeAccessKey(formatAccessKey(NFCE_KEY)), NFCE_KEY);
  assert.equal(normalizeAccessKey(NFCE_KEY.replace(/(\d{4})/g, "$1.")), NFCE_KEY);
  assert.equal(normalizeAccessKey(NFCE_KEY.slice(0, 43)), null);
  assert.equal(normalizeAccessKey(BAD_DV_KEY), null);
  assert.equal(normalizeAccessKey(NFE_KEY), null);
});

test("chave: mensagem diz o que corrigir", () => {
  assert.equal(accessKeyProblem(NFCE_KEY), null);
  assert.match(accessKeyProblem("1234"), /44 números/);
  assert.match(accessKeyProblem(BAD_DV_KEY), /não bate/);
  assert.match(accessKeyProblem(NFE_KEY), /não bate/);
});

test("chave: blocos de 4 e no máximo 44 dígitos", () => {
  assert.equal(formatAccessKey("12345678ab9"), "1234 5678 9");
  assert.equal(formatAccessKey(NFCE_KEY + "999").replace(/ /g, ""), NFCE_KEY);
  assert.equal(formatAccessKey(NFCE_KEY).split(" ").length, 11);
});

test("QR: tira a chave do parâmetro p da URL da SEFAZ", () => {
  const url = `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${NFCE_KEY}|2|1|1|ABCDEF0123`;
  assert.equal(accessKeyFromQrUrl(url), NFCE_KEY);
  assert.equal(accessKeyFromQrUrl(`https://sefaz.gov.br/nfce?p=${NFCE_KEY}`), NFCE_KEY);
  assert.equal(accessKeyFromQrUrl("https://exemplo.com/?q=1"), null);
  assert.equal(accessKeyFromQrUrl(`https://sefaz.gov.br/nfce?p=${BAD_DV_KEY}|2|1`), null);
  assert.equal(accessKeyFromQrUrl("PIX 00020126"), null);
});

test("imagem: QR de NFC-e vai pelo QR, outro QR avisa, sem QR vai pro OCR", () => {
  assert.equal(receiptUploadPath(`https://www.nfce.fazenda.sp.gov.br/qrcode?p=${NFCE_KEY}|2|1|1|ABCDEF0123`), "qr");
  assert.equal(receiptUploadPath("https://exemplo.com/?q=1"), "not-nfce");
  assert.equal(receiptUploadPath("PIX 00020126"), "not-nfce");
  assert.equal(receiptUploadPath(null), "ocr");
});

test("foto: reduz até 1600 px no lado maior sem aumentar", () => {
  assert.deepEqual(fitWithin(4000, 3000, 1600), { width: 1600, height: 1200 });
  assert.deepEqual(fitWithin(3000, 4000, 1600), { width: 1200, height: 1600 });
  assert.deepEqual(fitWithin(800, 600, 1600), { width: 800, height: 600 });
});

test("polling: começa em 2 s e para de crescer em 5 s", () => {
  assert.equal(nextPollDelay(0), 2000);
  assert.equal(nextPollDelay(1), 2500);
  assert.ok(nextPollDelay(3) > nextPollDelay(2));
  assert.equal(nextPollDelay(20), 5000);
});

const item = (id, match) => ({ id, name: id, quantity: 1, completed: false, match });

test("estado do item conforme a correspondência", () => {
  assert.equal(itemMatchState(item("a", { id: "m", status: "matched", confidence: 0.9 }), true), "found");
  assert.equal(itemMatchState(item("a", { id: "m", status: "confirmed", confidence: 0.7 }), true), "found");
  assert.equal(itemMatchState(item("a", { id: "m", status: "needs_review", confidence: 0.7 }), true), "review");
  assert.equal(itemMatchState(item("a", null), true), "missing");
  assert.equal(itemMatchState(item("a", null), false), "none");
});

test("resumo: encontrados e para conferir", () => {
  const items = [
    item("a", { id: "1", status: "matched", confidence: 0.9 }),
    item("b", { id: "2", status: "confirmed", confidence: 0.7 }),
    item("c", { id: "3", status: "needs_review", confidence: 0.7 }),
    item("d", null),
  ];
  assert.deepEqual(matchSummary(items), { found: 2, review: 1, total: 4 });
  assert.equal(matchSummaryLabel({ found: 2, review: 1, total: 4 }), "2 de 4 itens encontrados na nota · 1 para conferir");
  assert.equal(matchSummaryLabel({ found: 0, review: 0, total: 3 }), "0 de 3 itens encontrados na nota");
  assert.equal(matchSummaryLabel({ found: 1, review: 0, total: 1 }), "1 de 1 item encontrado na nota");
});

test("itens da nota que não casaram com a lista", () => {
  const line = (index) => ({ index, description: `ITEM ${index}`, quantity: 1, unitCents: 100, totalCents: 100 });
  const receipt = {
    items: [line(0), line(1), line(2)],
    matches: [{ id: "m", shoppingItemId: "a", status: "matched", confidence: 0.9, invoiceItem: line(1) }],
  };
  assert.deepEqual(
    extraInvoiceItems(receipt).map((extra) => extra.index),
    [0, 2],
  );
});

test("linha da nota e método de leitura", () => {
  const line = { index: 0, description: "LEITE INTEG 1L", quantity: 2, unitCents: 549, totalCents: 1098 };
  assert.equal(invoiceLineLabel(line).replace(/\s/g, " "), "2x LEITE INTEG 1L · R$ 10,98");
  assert.match(invoiceLineLabel({ ...line, quantity: 0.532 }), /^0,532x/);
  assert.equal(extractionMethodLabel("qrcode"), "via QR code");
  assert.equal(extractionMethodLabel("ocr"), "via foto");
  assert.equal(extractionMethodLabel(null), null);
});

test("retry button only shows when allowed and the note failed or needs review", () => {
  const retry = (allowed) => ({ allowed, remaining: 2 });
  assert.equal(canRetryReceipt({ status: "failed", retry: retry(true) }), true);
  assert.equal(canRetryReceipt({ status: "needs_review", retry: retry(true) }), true);
  assert.equal(canRetryReceipt({ status: "failed", retry: retry(false) }), false);
  for (const status of ["done", "queued", "processing", null]) {
    assert.equal(canRetryReceipt({ status, retry: retry(true) }), false, String(status));
  }
});

test("retriesLeftLabel uses singular and plural", () => {
  assert.equal(retriesLeftLabel(1), "1 tentativa restante");
  assert.equal(retriesLeftLabel(2), "2 tentativas restantes");
});

test("resolutionPathLabel maps each origin and hides unknown ones", () => {
  assert.equal(resolutionPathLabel("qr_image"), "Lido pelo QR code");
  assert.equal(resolutionPathLabel("printed_key"), "Lido pela chave de acesso");
  assert.equal(resolutionPathLabel("qr_submitted"), "QR code");
  assert.equal(resolutionPathLabel("text"), "Lido da foto — confira os itens");
  assert.equal(resolutionPathLabel(null), null);
  assert.equal(resolutionPathLabel("future_path"), null);
});

test("readingMessage tells queued from reading and covers the timeout", () => {
  assert.equal(readingMessage("queued", false), "Na fila para ser lida");
  assert.equal(readingMessage("processing", false), "Lendo sua nota…");
  assert.equal(readingMessage("processing", true), "Está demorando mais que o normal.");
  for (const status of ["done", "failed", "needs_review", null]) {
    assert.equal(readingMessage(status, false), null, String(status));
  }
});

test("readingJustFinished only fires after the user saw it pending", () => {
  assert.equal(readingJustFinished(true, "done"), true);
  assert.equal(readingJustFinished(false, "done"), false);
  for (const status of ["needs_review", "failed", "processing"]) {
    assert.equal(readingJustFinished(true, status), false, status);
  }
});
