import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "./safe-next.ts";

test("safeNextPath keeps internal paths", () => {
  assert.equal(safeNextPath("/grupos/abc"), "/grupos/abc");
});

test("safeNextPath rejects external or missing targets", () => {
  assert.equal(safeNextPath("https://evil.example"), "/painel");
  assert.equal(safeNextPath("//evil.example"), "/painel");
  assert.equal(safeNextPath("/\\evil.example"), "/painel");
  assert.equal(safeNextPath(null), "/painel");
});
