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
