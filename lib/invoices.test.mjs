import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canLinkInvoice,
  invoiceDifferenceCents,
  invoiceErrorMessage,
  invoiceStatusLabel,
  invoiceSummary,
  isInvoicePending,
  pendingInvoiceIds,
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

test("invoiceSummary separa valor dos itens, desconto e total", () => {
  const line = (line_total) => ({ description: "x", quantity: 1, unit_amount: line_total, line_total });
  const cases = [
    // [nome, resolutionPath, linhas, itemsTotal, estimatedTotal, esperado]
    ["exemplo OCR com desconto", "ocr_escalated", [89.4, 14.75], 100, 100, [10415, 415, 10000, 0]],
    ["OCR sem desconto", "ocr", [10, 5], 15, 15, [1500, 0, 1500, 0]],
    ["OCR com item faltando", "ocr", [10], 10, 15, [1000, 0, 1500, -500]],
    ["fiscal com desconto", "submitted_qr", [50, 50], 100, 90, [10000, 1000, 9000, 0]],
    ["arredondamento", "ocr", [10.03], 10.03, 10, [1003, 0, 1000, 3]],
    ["total não identificado", "ocr", [10], 10, 0, [1000, 0, 0, 0]],
    ["sem itens", "ocr", [], 0, 42, [0, 0, 4200, 0]],
  ];
  for (const [name, resolutionPath, lines, itemsTotal, estimatedTotal, [items, discount, total, difference]] of cases) {
    assert.deepEqual(
      invoiceSummary({ resolutionPath, items: lines.map(line), itemsTotal, estimatedTotal }),
      { itemsCents: items, discountCents: discount, totalCents: total, differenceCents: difference },
      name,
    );
  }
});

test("pendingInvoiceIds keeps only invoices still being read", () => {
  assert.deepEqual(
    pendingInvoiceIds([
      { id: "a", status: "queued" },
      { id: "b", status: "processed" },
      { id: "c", status: "processing" },
      { id: "d", status: "failed" },
    ]),
    ["a", "c"],
  );
});
