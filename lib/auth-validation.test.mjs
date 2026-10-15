import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fieldErrorFromApi,
  firstErrorField,
  isPasswordLengthOk,
  validateLogin,
  validateRegistration,
} from "./auth-validation.ts";

const valid = { name: "Ana", email: "ana@kotta.com", password: "segredo123", pixKey: "", acceptTerms: true };

test("a complete registration has no errors", () => {
  assert.deepEqual(validateRegistration(valid), {});
});

test("each invalid registration field gets its own message", () => {
  const errors = validateRegistration({ name: " ", email: "ana@", password: "12345", pixKey: "123", acceptTerms: false });
  assert.deepEqual(Object.keys(errors).sort(), ["acceptTerms", "email", "name", "password", "pixKey"]);
  assert.equal(firstErrorField(errors), "name");
});

test("password max is 72 bytes, like the API", () => {
  assert.equal(isPasswordLengthOk("a".repeat(72)), true);
  assert.equal(isPasswordLengthOk("é".repeat(37)), false); // 74 bytes
  assert.equal(isPasswordLengthOk("1234567"), false);
});

test("pix key accepts the supported shapes", () => {
  for (const pixKey of ["123.456.789-09", "11.222.333/0001-81", "ana@kotta.com", "(11) 91234-5678", "123e4567-e89b-12d3-a456-426614174000"]) {
    assert.equal(validateRegistration({ ...valid, pixKey }).pixKey, undefined, pixKey);
  }
  assert.ok(validateRegistration({ ...valid, pixKey: "abc" }).pixKey);
  assert.ok(validateRegistration({ ...valid, pixKey: "1".repeat(141) }).pixKey);
});

test("login needs a valid email and a password", () => {
  assert.deepEqual(validateLogin({ email: "ana@kotta.com", password: "x" }), {});
  assert.deepEqual(Object.keys(validateLogin({ email: "", password: "" })), ["email", "password"]);
});

test("API validation messages map to the right field", () => {
  const cases = {
    "Name is required": "name",
    "Email is required": "email",
    "Email is invalid": "email",
    "Password must be at least 8 characters": "password",
    "Password must be at most 72 bytes": "password",
    "Pix key is too long": "pixKey",
    "Pix key is invalid": "pixKey",
  };
  for (const [message, field] of Object.entries(cases)) {
    assert.equal(fieldErrorFromApi(message)?.field, field, message);
  }
  assert.equal(fieldErrorFromApi("Invalid request body"), undefined);
});
