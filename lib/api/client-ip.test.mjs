import assert from "node:assert/strict";
import { test } from "node:test";
import { BFF_SECRET_HEADER, CLIENT_IP_HEADER, clientIpHeaders } from "./client-ip.ts";

const expected = (ip) => ({ "X-Kotta-Client-IP": ip, "X-Kotta-Bff-Secret": "s" });

test("header names follow the proposed api#250 contract", () => {
  assert.equal(CLIENT_IP_HEADER, "X-Kotta-Client-IP");
  assert.equal(BFF_SECRET_HEADER, "X-Kotta-Bff-Secret");
});

test("without a secret nothing is sent", () => {
  const incoming = new Headers({ "x-real-ip": "203.0.113.7" });
  assert.deepEqual(clientIpHeaders(incoming, undefined), {});
  assert.deepEqual(clientIpHeaders(incoming, ""), {});
});

test("sends the edge IP and the secret together", () => {
  assert.deepEqual(clientIpHeaders(new Headers({ "x-real-ip": "203.0.113.7" }), "s"), expected("203.0.113.7"));
});

test("falls back to the first x-forwarded-for entry", () => {
  const incoming = new Headers({ "x-forwarded-for": " 198.51.100.4 , 10.0.0.1" });
  assert.deepEqual(clientIpHeaders(incoming, "s"), expected("198.51.100.4"));
});

test("x-real-ip wins over x-forwarded-for", () => {
  const incoming = new Headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.4" });
  assert.deepEqual(clientIpHeaders(incoming, "s"), expected("203.0.113.7"));
});

test("IPv6 goes as received", () => {
  assert.deepEqual(clientIpHeaders(new Headers({ "x-real-ip": "2001:db8::1" }), "s"), expected("2001:db8::1"));
});

test("invalid or missing IP sends nothing", () => {
  for (const ip of ["not-an-ip", "203.0.113.7:443", ""]) {
    assert.deepEqual(clientIpHeaders(new Headers({ "x-real-ip": ip }), "s"), {}, ip);
  }
  assert.deepEqual(clientIpHeaders(new Headers(), "s"), {});
});

test("values the browser sends under the API header names are ignored", () => {
  const incoming = new Headers({
    "X-Kotta-Client-IP": "6.6.6.6",
    "X-Kotta-Bff-Secret": "forged",
    "x-real-ip": "203.0.113.7",
  });
  assert.deepEqual(clientIpHeaders(incoming, "s"), expected("203.0.113.7"));
  assert.deepEqual(clientIpHeaders(incoming, undefined), {});
});
