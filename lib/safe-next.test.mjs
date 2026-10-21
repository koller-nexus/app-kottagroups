import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "./safe-next.ts";

test("safeNextPath keeps internal paths", () => {
  assert.equal(safeNextPath("/grupos/abc"), "/grupos/abc");
});

test("safeNextPath rejects external or missing targets", () => {
  assert.equal(safeNextPath("https://evil.example"), "/");
  assert.equal(safeNextPath("//evil.example"), "/");
  assert.equal(safeNextPath("/\\evil.example"), "/");
  assert.equal(safeNextPath(null), "/");
  assert.equal(safeNextPath(""), "/");
});

test("safeNextPath rejects targets the browser would read as another origin", () => {
  for (const value of ["/\t/x", "/\n/x", "/\r/x", "/\t\\x", "/.//x", "/..//x", "/%2e//x", "/x/..//y"]) {
    assert.equal(safeNextPath(value), "/", JSON.stringify(value));
  }
});

test("safeNextPath falls back to the caller default", () => {
  assert.equal(safeNextPath("/\t/x", "/grupos/g/notas/n"), "/grupos/g/notas/n");
});

test("safeNextPath keeps query and hash and normalizes dot segments", () => {
  assert.equal(safeNextPath("/convites/x?origem=link#aceitar"), "/convites/x?origem=link#aceitar");
  assert.equal(safeNextPath("/grupos/../perfil"), "/perfil");
});

test("safeNextPath is idempotent", () => {
  for (const value of ["/grupos/abc", "/convites/x?origem=link#aceitar", "/grupos/../perfil", "/grupos/ção", "/.//x", "/\t/x"]) {
    const once = safeNextPath(value);
    assert.equal(safeNextPath(once), once, JSON.stringify(value));
  }
});
