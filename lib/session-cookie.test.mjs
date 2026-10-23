import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  clearSessionCookies,
  readSessionToken,
  sessionCookieAction,
  sessionCookieOptions,
} from "./session-cookie.ts";

const NOW = 1_800_000_000_000;
const VALID_EXP = NOW / 1000 + 3600;

function token(payload) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "HS256", typ: "JWT" })}.${part(payload)}.assinatura`;
}

function jar(values) {
  return { get: (name) => (name in values ? { value: values[name] } : undefined) };
}

test("nomes do cookie novo e do antigo", () => {
  assert.equal(SESSION_COOKIE, "__Host-kotta_session");
  assert.equal(LEGACY_SESSION_COOKIE, "kotta_session");
});

test("sessionCookieOptions: preso ao host, seguro sempre, vence com o token", () => {
  const options = sessionCookieOptions(token({ exp: VALID_EXP }));
  assert.deepEqual(options, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(VALID_EXP * 1000),
  });
  assert.equal("domain" in options, false);
});

test("sessionCookieOptions: sem exp usa 24 h", () => {
  assert.deepEqual(sessionCookieOptions(token({ sub: "x" })), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
});

test("readSessionToken prefere o novo e cai no antigo", () => {
  assert.equal(readSessionToken(jar({ [SESSION_COOKIE]: "novo" })), "novo");
  assert.equal(readSessionToken(jar({ [LEGACY_SESSION_COOKIE]: "antigo" })), "antigo");
  assert.equal(readSessionToken(jar({ [SESSION_COOKIE]: "", [LEGACY_SESSION_COOKIE]: "antigo" })), "antigo");
  assert.equal(readSessionToken(jar({ [SESSION_COOKIE]: "novo", [LEGACY_SESSION_COOKIE]: "antigo" })), "novo");
  assert.equal(readSessionToken(jar({})), undefined);
  assert.equal(readSessionToken(jar({ [SESSION_COOKIE]: "", [LEGACY_SESSION_COOKIE]: "" })), undefined);
});

test("clearSessionCookies apaga o novo com Secure e o antigo", () => {
  const calls = [];
  clearSessionCookies({ delete: (arg) => calls.push(arg) });
  assert.deepEqual(calls, [{ name: SESSION_COOKIE, path: "/", secure: true }, LEGACY_SESSION_COOKIE]);
});

test("sessionCookieAction segue a tabela de estados", () => {
  const valid = token({ exp: VALID_EXP });
  const expired = token({ exp: NOW / 1000 - 60 });
  const cases = [
    ["sem sessão", undefined, undefined, "none"],
    ["antigo vazio", undefined, "", "drop-legacy"],
    ["novo vazio e antigo vazio", "", "", "drop-legacy"],
    ["nova vencida", expired, undefined, "clear"],
    ["antiga vencida", undefined, expired, "clear"],
    ["antiga ilegível", undefined, "x", "clear"],
    ["nova vencida com antiga válida", expired, valid, "clear"],
    ["só antiga válida", undefined, valid, "migrate"],
    ["nova vazia e antiga válida", "", valid, "migrate"],
    ["nova + antiga", valid, "qualquer", "drop-legacy"],
    ["só nova", valid, undefined, "none"],
  ];
  for (const [name, current, legacy, expected] of cases) {
    assert.equal(sessionCookieAction(current, legacy, NOW), expected, name);
  }
});
