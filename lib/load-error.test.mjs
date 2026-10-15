import assert from "node:assert/strict";
import { test } from "node:test";
import { loadErrorKind } from "./load-error.ts";

test("sem rede no navegador é offline, mesmo com digest de API", () => {
  assert.equal(loadErrorKind({ isOnline: false }), "offline");
  assert.equal(loadErrorKind({ digest: "API_UNAVAILABLE:NETWORK_ERROR", isOnline: false }), "offline");
});

test("digest de API fora do ar vira unavailable", () => {
  assert.equal(loadErrorKind({ digest: "API_UNAVAILABLE:NETWORK_ERROR", isOnline: true }), "unavailable");
  assert.equal(loadErrorKind({ digest: "API_UNAVAILABLE:SERVICE_UNAVAILABLE", isOnline: true }), "unavailable");
});

test("qualquer outro erro é unexpected", () => {
  assert.equal(loadErrorKind({ digest: "1234567890", isOnline: true }), "unexpected");
  assert.equal(loadErrorKind({ isOnline: true }), "unexpected");
});
