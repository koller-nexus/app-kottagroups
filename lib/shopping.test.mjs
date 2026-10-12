import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatFileSize,
  parseQuantity,
  progressLabel,
  validateItemName,
  validateListName,
  validateReceipt,
} from "./shopping.ts";

test("nome da lista: obrigatório e até 120 caracteres", () => {
  assert.equal(validateListName("  Feira  "), null);
  assert.match(validateListName("   "), /nome/);
  assert.equal(validateListName("a".repeat(120)), null);
  assert.match(validateListName("a".repeat(121)), /120/);
  // Conta runas, como a API: 120 emojis cabem.
  assert.equal(validateItemName("🍎".repeat(120)), null);
});

test("quantidade: inteiro de 1 a 9999", () => {
  assert.equal(parseQuantity("3"), 3);
  assert.equal(parseQuantity(" 9999 "), 9999);
  for (const raw of ["", "0", "10000", "1,5", "-1", "2e3", "abc"]) {
    assert.equal(parseQuantity(raw), null, raw);
  }
});

test("nota fiscal: tipo e tamanho", () => {
  assert.equal(validateReceipt({ type: "image/png", size: 1000 }), null);
  assert.equal(validateReceipt({ type: "application/pdf", size: 10 * 1024 * 1024 }), null);
  assert.match(validateReceipt({ type: "image/gif", size: 1000 }), /PDF/);
  assert.match(validateReceipt({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 }), /10 MB/);
  assert.match(validateReceipt({ type: "", size: 0 }), /Escolha/);
});

test("rótulos", () => {
  assert.equal(progressLabel(3, 5), "3 de 5 itens");
  assert.equal(progressLabel(0, 1), "0 de 1 item");
  assert.equal(progressLabel(0, 0), "Nenhum item");
  assert.equal(formatFileSize(500), "1 KB");
  assert.equal(formatFileSize(1536 * 1024), "1,5 MB");
});
