import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, friendlyMessage, parseErrorBody, rateLimitMessage } from "./errors.ts";

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

test("todo ApiError carrega digest API_ERROR:<status>:<code> para a tela de erro", () => {
  assert.equal(new ApiError(503, "NETWORK_ERROR", "x").digest, "API_ERROR:503:NETWORK_ERROR");
  assert.equal(new ApiError(502, "INVALID_RESPONSE", "x").digest, "API_ERROR:502:INVALID_RESPONSE");
  assert.equal(new ApiError(403, "EDGE_BLOCKED", "x").digest, "API_ERROR:403:EDGE_BLOCKED");
  assert.equal(new ApiError(404, "NOT_FOUND", "x").digest, "API_ERROR:404:NOT_FOUND");
});

test("recusas do envio de foto leem em português", () => {
  assert.equal(friendlyMessage("AVATAR_TOO_LARGE"), "A foto passa de 5 MB. Escolha uma menor.");
  assert.equal(friendlyMessage("INVALID_AVATAR_TYPE"), "Use uma foto JPG, PNG ou WebP.");
});

test("auth codes have friendly messages", () => {
  assert.equal(friendlyMessage("EMAIL_NOT_CONFIRMED"), "Confirme seu e-mail para continuar.");
  assert.equal(friendlyMessage("INVALID_TOKEN"), "Este link não é mais válido. Peça um novo.");
  assert.doesNotMatch(friendlyMessage("RATE_LIMITED"), /minutos/);
});

test("invite codes have friendly messages", () => {
  assert.equal(friendlyMessage("INVITE_INVALID"), "Este convite não vale mais. Peça um novo link a quem convidou.");
  assert.equal(friendlyMessage("INVITE_EMAIL_MISMATCH"), "Este convite foi enviado para outro e-mail.");
});

test("rateLimitMessage shows the wait when the API sends it", () => {
  assert.equal(rateLimitMessage(30), "Muitas tentativas seguidas. Tente de novo em 30 s.");
  assert.equal(rateLimitMessage(90), "Muitas tentativas seguidas. Tente de novo em 2 min.");
  assert.equal(rateLimitMessage(), friendlyMessage("RATE_LIMITED"));
  assert.equal(new ApiError(429, "RATE_LIMITED", "x", 45).retryAfter, 45);
});
