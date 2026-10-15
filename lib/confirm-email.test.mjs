import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmationOutcome, isUsableConfirmationToken } from "./confirm-email.ts";

const confirmed = { emailConfirmed: true };
const unconfirmed = { emailConfirmed: false };

test("rejects missing and whitespace-only tokens", () => {
  assert.equal(isUsableConfirmationToken(null), false);
  assert.equal(isUsableConfirmationToken("   "), false);
  assert.equal(isUsableConfirmationToken("token-123"), true);
  assert.equal(confirmationOutcome({ token: " ", status: 0 }).state, "missing");
});

test("a 2xx confirms, with or without a session", () => {
  assert.deepEqual(confirmationOutcome({ token: "t", status: 200 }), { state: "success", signedIn: false });
  assert.deepEqual(confirmationOutcome({ token: "t", status: 200, sessionUser: unconfirmed }), {
    state: "success",
    signedIn: true,
  });
});

test("a used link for an already confirmed account reads as success", () => {
  assert.deepEqual(confirmationOutcome({ token: "t", status: 400, sessionUser: confirmed }), {
    state: "already-confirmed",
    signedIn: true,
  });
});

test("expired or invalid links share one state", () => {
  assert.equal(confirmationOutcome({ token: "t", status: 400 }).state, "invalid-or-expired");
  assert.equal(confirmationOutcome({ token: "t", status: 400, sessionUser: unconfirmed }).state, "invalid-or-expired");
});

test("server and network failures are unexpected", () => {
  assert.equal(confirmationOutcome({ token: "t", status: 503 }).state, "unexpected-error");
  assert.equal(confirmationOutcome({ token: "t", status: 0 }).state, "unexpected-error");
});
