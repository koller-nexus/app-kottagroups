import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPasswordValidationMessage,
  getRecoveryErrorMessage,
  getRecoveryState,
  isUsableResetToken,
  recoverPassword,
} from "./forget-password.ts";

test("posts the token and password to recovery-email without putting the token in the URL", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (input, init) => {
    request = { input, init };
    return new Response(JSON.stringify({ data: { id: "user-1" } }), { status: 200 });
  };

  try {
    const result = await recoverPassword("token-123", "newhorse1");
    assert.equal(result.state, "success");
    assert.equal(request.input, "/api/v1/users/recovery-email");
    assert.deepEqual(JSON.parse(request.init.body), {
      token: "token-123",
      password: "newhorse1",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects missing and whitespace-only reset tokens", () => {
  assert.equal(isUsableResetToken(null), false);
  assert.equal(isUsableResetToken("   "), false);
  assert.equal(isUsableResetToken("token-123"), true);
});

test("validates password length and confirmation locally", () => {
  assert.equal(
    getPasswordValidationMessage("short", "short"),
    "A senha precisa ter pelo menos 8 caracteres.",
  );
  assert.equal(
    getPasswordValidationMessage("newhorse1", "otherpass"),
    "As senhas não coincidem.",
  );
  assert.equal(getPasswordValidationMessage("newhorse1", "newhorse1"), undefined);
});

test("maps a successful response to the success state", () => {
  assert.equal(getRecoveryState(200), "success");
});

test("maps expected recovery failures and translates known API messages", () => {
  assert.equal(getRecoveryState(400), "invalid");
  assert.equal(
    getRecoveryErrorMessage({
      error: { message: "Recovery is invalid or expired" },
    }),
    "Este link é inválido, expirou ou já foi utilizado.",
  );
  assert.equal(
    getRecoveryErrorMessage({
      error: { message: "Password must be at least 8 characters" },
    }),
    "A senha precisa ter pelo menos 8 caracteres.",
  );
});

test("redacts the token from unexpected API text", () => {
  assert.equal(
    getRecoveryErrorMessage(
      { error: { message: "Failed for token-123" } },
      "token-123",
    ),
    "Failed for [oculto]",
  );
});

test("uses a safe fallback for unexpected or malformed errors", () => {
  assert.equal(getRecoveryState(503), "unexpected-error");
  assert.equal(
    getRecoveryErrorMessage({}),
    "Não foi possível redefinir sua senha agora.",
  );
});
