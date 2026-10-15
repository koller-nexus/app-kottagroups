import assert from "node:assert/strict";
import { test } from "node:test";
import { isSessionExpired, sessionExpiresAt, sessionMsLeft, watcherDeadlines } from "./session-expiry.ts";

const NOW = 1_800_000_000_000;

function token(payload) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "HS256", typ: "JWT" })}.${part(payload)}.assinatura`;
}

test("sessionExpiresAt lê o exp em milissegundos", () => {
  assert.equal(sessionExpiresAt(token({ exp: 1_800_000_060 })), 1_800_000_060_000);
});

test("tokens ilegíveis não têm vencimento e contam como vencidos", () => {
  const broken = ["abc", "a.b", "a.%%%.c", token({ sub: "x" }), token({ exp: "amanhã" }), "a.bm90IGpzb24.c"];
  for (const value of broken) {
    assert.equal(sessionExpiresAt(value), undefined, value);
    assert.equal(isSessionExpired(value, NOW), true, value);
  }
  assert.equal(isSessionExpired(undefined, NOW), true);
});

test("isSessionExpired aplica a folga de 30 segundos", () => {
  assert.equal(isSessionExpired(token({ exp: NOW / 1000 + 10 }), NOW), true);
  assert.equal(isSessionExpired(token({ exp: NOW / 1000 + 60 }), NOW), false);
  assert.equal(isSessionExpired(token({ exp: NOW / 1000 - 1 }), NOW), true);
});

test("watcherDeadlines avisa 2 minutos antes e nunca é negativo", () => {
  assert.deepEqual(watcherDeadlines(300_000), { warnInMs: 180_000, expireInMs: 300_000 });
  assert.deepEqual(watcherDeadlines(60_000), { warnInMs: 0, expireInMs: 60_000 });
  assert.deepEqual(watcherDeadlines(-5), { warnInMs: 0, expireInMs: 0 });
  assert.equal(watcherDeadlines(2 ** 40).expireInMs, 2 ** 31 - 1);
});

test("sessionMsLeft conta a partir de agora e zera sem token", () => {
  assert.equal(sessionMsLeft(token({ exp: NOW / 1000 + 90 }), NOW), 90_000);
  assert.ok(sessionMsLeft(undefined, NOW) <= 0);
  assert.ok(sessionMsLeft("abc", NOW) <= 0);
});
