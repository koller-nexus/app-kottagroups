import assert from "node:assert/strict";
import { test } from "node:test";
import { rateLimitMessage } from "./api/errors.ts";
import { isPixKeyChange, passwordErrorMessage, profileUpdateBody } from "./profile-update.ts";

test("isPixKeyChange compara a chave digitada, sem espaços, com a salva", () => {
  assert.equal(isPixKeyChange("a@b.com", "a@b.com"), false);
  assert.equal(isPixKeyChange(" a@b.com ", "a@b.com"), false);
  assert.equal(isPixKeyChange("c@d.com", "a@b.com"), true);
  assert.equal(isPixKeyChange("", "a@b.com"), true);
  assert.equal(isPixKeyChange("a@b.com", ""), true);
  assert.equal(isPixKeyChange("", ""), false);
});

test("profileUpdateBody manda só o nome quando a chave não mudou", () => {
  assert.deepEqual(
    profileUpdateBody({ name: "Ana", pixKey: "a@b.com", savedPixKey: "a@b.com", currentPassword: "segredo" }),
    { name: "Ana" },
  );
});

test("profileUpdateBody manda chave e senha na troca e na primeira chave", () => {
  assert.deepEqual(
    profileUpdateBody({ name: "Ana", pixKey: "c@d.com", savedPixKey: "a@b.com", currentPassword: "segredo" }),
    { name: "Ana", pixKey: "c@d.com", currentPassword: "segredo" },
  );
  assert.deepEqual(
    profileUpdateBody({ name: "Ana", pixKey: "c@d.com", savedPixKey: "", currentPassword: "segredo" }),
    { name: "Ana", pixKey: "c@d.com", currentPassword: "segredo" },
  );
});

test("profileUpdateBody manda pixKey null na remoção", () => {
  assert.deepEqual(
    profileUpdateBody({ name: "Ana", pixKey: "", savedPixKey: "a@b.com", currentPassword: "segredo" }),
    { name: "Ana", pixKey: null, currentPassword: "segredo" },
  );
});

test("profileUpdateBody manda a senha como foi digitada", () => {
  assert.deepEqual(
    profileUpdateBody({ name: "Ana", pixKey: "c@d.com", savedPixKey: "a@b.com", currentPassword: "" }),
    { name: "Ana", pixKey: "c@d.com", currentPassword: "" },
  );
  assert.deepEqual(
    profileUpdateBody({ name: "Ana", pixKey: "c@d.com", savedPixKey: "a@b.com", currentPassword: " se gredo " }),
    { name: "Ana", pixKey: "c@d.com", currentPassword: " se gredo " },
  );
});

test("passwordErrorMessage traduz só os erros de senha", () => {
  assert.equal(passwordErrorMessage("CURRENT_PASSWORD_REQUIRED"), "Digite sua senha atual para trocar a chave Pix.");
  assert.equal(passwordErrorMessage("CURRENT_PASSWORD_INVALID"), "Senha incorreta.");
  assert.equal(passwordErrorMessage("RATE_LIMITED", 120), rateLimitMessage(120));
  assert.equal(passwordErrorMessage("RATE_LIMITED"), rateLimitMessage());
  assert.equal(passwordErrorMessage("VALIDATION_FAILED"), undefined);
});
