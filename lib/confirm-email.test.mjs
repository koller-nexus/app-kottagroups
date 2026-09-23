import assert from "node:assert/strict";
import { test } from "node:test";
import {
  confirmEmail,
  getConfirmationErrorMessage,
  getConfirmationState,
  isExpiredConfirmationError,
  isUsableConfirmationToken,
} from "./confirm-email.ts";

test("posts the token to the confirmation endpoint without putting it in the URL", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (input, init) => {
    request = { input, init };
    return new Response(JSON.stringify({ data: { id: "user-1" } }), { status: 200 });
  };

  try {
    const result = await confirmEmail("token-123");
    assert.equal(result.state, "success");
    assert.equal(request.input, "/api/v1/auth/confirm-email");
    assert.deepEqual(JSON.parse(request.init.body), { token: "token-123" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects missing and whitespace-only confirmation tokens", () => {
  assert.equal(isUsableConfirmationToken(null), false);
  assert.equal(isUsableConfirmationToken("   "), false);
  assert.equal(isUsableConfirmationToken("token-123"), true);
});

test("maps a successful response to the success state", () => {
  assert.equal(getConfirmationState(200, { data: { id: "user-1" } }), "success");
});

test("maps expected token failures and preserves the API message", () => {
  assert.equal(getConfirmationState(400, { error: { code: "TOKEN_EXPIRED" } }), "invalid");
  assert.equal(
    getConfirmationErrorMessage({ error: { message: "Este link expirou." } }),
    "Este link expirou.",
  );
});

test("identifies an expired token so the UI can omit login navigation", () => {
  assert.equal(
    isExpiredConfirmationError({ error: { code: "TOKEN_EXPIRED" } }),
    true,
  );
  assert.equal(
    isExpiredConfirmationError({ error: { message: "Este link expirou." } }),
    true,
  );
  assert.equal(isExpiredConfirmationError({ error: { code: "TOKEN_INVALID" } }), false);
});

test("uses a safe fallback for unexpected or malformed errors", () => {
  assert.equal(getConfirmationState(503, null), "unexpected-error");
  assert.equal(getConfirmationErrorMessage({}), "Não foi possível confirmar seu e-mail agora.");
});
