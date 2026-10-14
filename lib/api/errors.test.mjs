import assert from "node:assert/strict";
import { test } from "node:test";
import { friendlyMessage, parseErrorBody } from "./errors.ts";

test("known codes get a specific message", () => {
  assert.equal(friendlyMessage("INVALID_CREDENTIALS"), "E-mail ou senha incorretos.");
});

test("unknown codes keep the generic message and show the code", () => {
  assert.match(friendlyMessage("ROUTE_NOT_FOUND"), /Não foi possível concluir agora.*\(ROUTE_NOT_FOUND\)/);
  assert.match(friendlyMessage("HTTP_403"), /\(HTTP_403\)/);
});

test("server errors read as unavailable", () => {
  assert.match(friendlyMessage("INTERNAL_ERROR"), /fora do ar.*\(INTERNAL_ERROR\)/);
});

test("parseErrorBody reads both envelopes", () => {
  assert.deepEqual(parseErrorBody({ code: "A", message: "b" }), { code: "A", message: "b" });
  assert.deepEqual(parseErrorBody({ error: { code: "A", message: "b" } }), { code: "A", message: "b" });
  assert.equal(parseErrorBody("<html>"), undefined);
});

test("a despesa que já tem nota ganha mensagem própria", () => {
  assert.equal(friendlyMessage("EXPENSE_HAS_INVOICE"), "Esta despesa já tem uma nota.");
});

test("receipt retry refusals read in Portuguese", () => {
  assert.equal(friendlyMessage("RECEIPT_RETRY_NOT_ALLOWED"), "Essa nota não pode ser lida de novo agora.");
  assert.equal(friendlyMessage("RECEIPT_NOT_RETRYABLE"), "Essa nota já foi importada neste grupo.");
  assert.equal(friendlyMessage("RECEIPT_RETRY_LIMIT"), "Você já usou todas as tentativas para esta nota.");
});
