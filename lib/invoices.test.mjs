import assert from "node:assert/strict";
import { test } from "node:test";
import {
  invoiceErrorMessage,
  invoiceStatusLabel,
  isInvoicePending,
  parseInvoiceItems,
  reaisToCents,
} from "./invoices.ts";

test("invoiceStatusLabel maps every API status to pt-BR", () => {
  assert.equal(invoiceStatusLabel("queued"), "Na fila");
  assert.equal(invoiceStatusLabel("processing"), "Lendo a nota");
  assert.equal(invoiceStatusLabel("done"), "Pronta");
  assert.equal(invoiceStatusLabel("failed"), "Falhou");
  assert.equal(invoiceStatusLabel("needs_review"), "Revisar");
  assert.equal(invoiceStatusLabel("other"), "other");
});

test("isInvoicePending only for queued and processing", () => {
  assert.equal(isInvoicePending("queued"), true);
  assert.equal(isInvoicePending("processing"), true);
  assert.equal(isInvoicePending("done"), false);
  assert.equal(isInvoicePending("needs_review"), false);
});

test("reaisToCents rounds float reais", () => {
  assert.equal(reaisToCents(12.34), 1234);
  assert.equal(reaisToCents(0.1 + 0.2), 30);
  assert.equal(reaisToCents(Number.NaN), 0);
});

test("parseInvoiceItems reads the API shape and skips junk", () => {
  const items = parseInvoiceItems([
    { description: " Arroz 5kg ", quantity: 2, unit_amount: 24.9, line_total: 49.8 },
    { description: "", quantity: 1 },
    null,
    "x",
    { description: "Feijão" },
  ]);
  assert.deepEqual(items, [
    { description: "Arroz 5kg", quantity: 2, unitCents: 2490, totalCents: 4980 },
    { description: "Feijão", quantity: 0, unitCents: 0, totalCents: 0 },
  ]);
  assert.deepEqual(parseInvoiceItems(null), []);
  assert.deepEqual(parseInvoiceItems({}), []);
});

test("invoiceErrorMessage translates timeout and generic failures", () => {
  assert.match(invoiceErrorMessage("Invoice processing timed out"), /demorou/);
  assert.match(invoiceErrorMessage("Invoice processing failed"), /Não conseguimos ler/);
  assert.match(invoiceErrorMessage(undefined), /Não conseguimos ler/);
});
