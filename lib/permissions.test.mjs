import assert from "node:assert/strict";
import { test } from "node:test";
import { canDeleteGroup, canDeleteInvoice, canInviteMembers, canEditExpense, canManageGroup, canSettle } from "./permissions.ts";

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

test("nota: quem enviou, dono ou admin excluem", () => {
  assert.equal(canDeleteInvoice("u1", "u1", "member"), true);
  assert.equal(canDeleteInvoice("u2", "u1", "owner"), true);
  assert.equal(canDeleteInvoice("u2", "u1", "admin"), true);
  assert.equal(canDeleteInvoice("u2", "u1", "member"), false);
  assert.equal(canDeleteInvoice("u2", "u1", undefined), false);
});

test("convidar: dono ou admin", () => {
  assert.equal(canInviteMembers("owner"), true);
  assert.equal(canInviteMembers("admin"), true);
  assert.equal(canInviteMembers("member"), false);
  assert.equal(canInviteMembers(undefined), false);
});
