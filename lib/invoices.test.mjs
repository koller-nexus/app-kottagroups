import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canLinkInvoice,
  invoiceDifferenceCents,
  invoiceErrorMessage,
  invoiceStatusLabel,
  isInvoicePending,
  linkableExpenses,
  parseInvoiceItems,
  reaisToCents,
  unlinkedInvoices,
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

test("invoiceDifferenceCents compares the read total with the expense", () => {
  const expense = { amountCents: 1000 };
  assert.equal(invoiceDifferenceCents({ status: "done", estimatedTotal: 12.5 }, expense), 250);
  assert.equal(invoiceDifferenceCents({ status: "needs_review", estimatedTotal: 8 }, expense), -200);
  assert.equal(invoiceDifferenceCents({ status: "done", estimatedTotal: 10 }, expense), 0);
  assert.equal(invoiceDifferenceCents({ status: "processing", estimatedTotal: 0 }, expense), null);
  assert.equal(invoiceDifferenceCents({ status: "failed", estimatedTotal: 0 }, expense), null);
});

test("linkableExpenses keeps free expenses and the one already linked to this note", () => {
  const expenses = [
    { id: "a", invoiceId: null },
    { id: "b", invoiceId: "n1" },
    { id: "c", invoiceId: "n2" },
  ];
  assert.deepEqual(
    linkableExpenses(expenses, { id: "n1" }).map((e) => e.id),
    ["a", "b"],
  );
});

test("unlinkedInvoices drops notes already on an expense", () => {
  const invoices = [
    { id: "n1", expenseId: null },
    { id: "n2", expenseId: "e1" },
  ];
  assert.deepEqual(
    unlinkedInvoices(invoices).map((i) => i.id),
    ["n1"],
  );
});

test("canLinkInvoice: nota lida ou já vinculada", () => {
  assert.equal(canLinkInvoice({ status: "done", expenseId: null }), true);
  assert.equal(canLinkInvoice({ status: "needs_review", expenseId: null }), true);
  assert.equal(canLinkInvoice({ status: "failed", expenseId: null }), false);
  assert.equal(canLinkInvoice({ status: "failed", expenseId: "e1" }), true);
  assert.equal(canLinkInvoice({ status: "queued", expenseId: null }), false);
  assert.equal(canLinkInvoice({ status: "processing", expenseId: null }), false);
});
