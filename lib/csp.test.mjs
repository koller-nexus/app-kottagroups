import assert from "node:assert/strict";
import { test } from "node:test";
import { contentSecurityPolicy, createNonce } from "./csp.ts";

const API = "https://api.kottagroups.com.br";

function directives(policy) {
  return new Map(
    policy.split("; ").map((directive) => {
      const [name, ...values] = directive.split(" ");
      return [name, values.join(" ")];
    }),
  );
}

test("production policy has every directive, in contract order", () => {
  const policy = contentSecurityPolicy({ nonce: "abc", apiOrigin: API, isDev: false });
  assert.equal(
    policy,
    [
      "default-src 'self'",
      "script-src 'self' 'nonce-abc' 'strict-dynamic'",
      "style-src 'self' 'nonce-abc'",
      "style-src-attr 'unsafe-inline'",
      `img-src 'self' blob: ${API}`,
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
});

test("production allows no unsafe source in script-src or style-src", () => {
  const policy = directives(contentSecurityPolicy({ nonce: "abc", apiOrigin: API, isDev: false }));
  for (const name of ["script-src", "style-src"]) {
    assert.doesNotMatch(policy.get(name), /unsafe/, name);
  }
});

test("development adds eval for scripts and inline styles", () => {
  const policy = directives(contentSecurityPolicy({ nonce: "abc", apiOrigin: API, isDev: true }));
  assert.equal(policy.get("script-src"), "'self' 'nonce-abc' 'strict-dynamic' 'unsafe-eval'");
  assert.equal(policy.get("style-src"), "'self' 'nonce-abc' 'unsafe-inline'");
});

test("img-src adds any loopback port only when the API is on loopback", () => {
  for (const apiOrigin of ["http://localhost:3003", "http://127.0.0.1:3003"]) {
    const policy = directives(contentSecurityPolicy({ nonce: "abc", apiOrigin, isDev: false }));
    assert.equal(
      policy.get("img-src"),
      `'self' blob: ${apiOrigin} http://localhost:* http://127.0.0.1:*`,
    );
  }
  const remote = directives(
    contentSecurityPolicy({ nonce: "abc", apiOrigin: "https://localhost.example.com", isDev: false }),
  );
  assert.equal(remote.get("img-src"), "'self' blob: https://localhost.example.com");
});

test("createNonce returns 16 random bytes in base64, new every call", () => {
  const nonces = Array.from({ length: 20 }, createNonce);
  for (const nonce of nonces) {
    assert.match(nonce, /^[A-Za-z0-9+/]+={0,2}$/);
    assert.equal(atob(nonce).length, 16);
  }
  assert.equal(new Set(nonces).size, 20);
});
