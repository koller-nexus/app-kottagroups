import assert from "node:assert/strict";
import { test } from "node:test";
import { canDeleteGroup, canEditExpense, canManageGroup, canSettle } from "./permissions.ts";

test("só o dono gerencia o grupo; admin pode excluir", () => {
  assert.equal(canManageGroup("owner"), true);
  assert.equal(canManageGroup("admin"), false);
  assert.equal(canDeleteGroup("admin"), true);
  assert.equal(canDeleteGroup("member"), false);
});

test("despesa: criador ou dono", () => {
  assert.equal(canEditExpense("me", "me", "member"), true);
  assert.equal(canEditExpense("me", "x", "owner"), true);
  assert.equal(canEditExpense("me", "x", "admin"), false);
});

test("quitação: só pagador ou recebedor", () => {
  assert.equal(canSettle("me", { from: "me", to: "x" }), true);
  assert.equal(canSettle("me", { from: "x", to: "y" }), false);
});
