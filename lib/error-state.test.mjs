import assert from "node:assert/strict";
import { test } from "node:test";
import { apiErrorFromDigest, errorKind } from "./error-state.ts";

test("sem rede no navegador é offline, mesmo com digest de API", () => {
  assert.equal(errorKind({ isOnline: false }), "offline");
  assert.equal(errorKind({ digest: "API_ERROR:503:SERVICE_UNAVAILABLE", isOnline: false }), "offline");
});

test("status 5xx ou código de indisponibilidade vira unavailable", () => {
  assert.equal(errorKind({ digest: "API_ERROR:503:SERVICE_UNAVAILABLE", isOnline: true }), "unavailable");
  assert.equal(errorKind({ digest: "API_ERROR:502:INVALID_RESPONSE", isOnline: true }), "unavailable");
  assert.equal(errorKind({ digest: "API_ERROR:200:NETWORK_ERROR", isOnline: true }), "unavailable");
  assert.equal(errorKind({ digest: "API_ERROR:403:EDGE_BLOCKED", isOnline: true }), "unavailable");
});

test("outro código da API é unexpected e expõe status e código", () => {
  assert.equal(errorKind({ digest: "API_ERROR:409:GROUP_ARCHIVED", isOnline: true }), "unexpected");
  assert.deepEqual(apiErrorFromDigest("API_ERROR:409:GROUP_ARCHIVED"), { status: 409, code: "GROUP_ARCHIVED" });
});

test("digest do Next ou ausente é unexpected sem código da API", () => {
  assert.equal(errorKind({ digest: "1234567890", isOnline: true }), "unexpected");
  assert.equal(errorKind({ isOnline: true }), "unexpected");
  assert.equal(apiErrorFromDigest("1234567890"), undefined);
  assert.equal(apiErrorFromDigest(undefined), undefined);
  assert.equal(apiErrorFromDigest("API_ERROR:abc:X"), undefined);
});
