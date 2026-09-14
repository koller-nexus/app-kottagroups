import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBRL } from "./money.ts";

test("formatBRL formats zero cents", () => {
  const formatted = formatBRL(0);
  assert.match(formatted, /0[,.]00/);
  assert.match(formatted, /R\$/);
});

test("formatBRL formats positive cents in pt-BR", () => {
  const formatted = formatBRL(32050);
  assert.match(formatted, /320,50/);
  assert.match(formatted, /R\$/);
});

test("formatBRL formats negative cents", () => {
  const formatted = formatBRL(-4200);
  assert.match(formatted, /42,00/);
  assert.match(formatted, /[-−]/);
});
