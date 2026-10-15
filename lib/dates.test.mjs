import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMemberSince } from "./dates.ts";

test("formatMemberSince mostra mês e ano por extenso", () => {
  assert.equal(formatMemberSince("2026-03-10T12:00:00Z"), "março de 2026");
});

test("formatMemberSince devolve null sem data válida", () => {
  assert.equal(formatMemberSince(undefined), null);
  assert.equal(formatMemberSince(""), null);
  assert.equal(formatMemberSince("não-é-data"), null);
});
