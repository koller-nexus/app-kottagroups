import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_STATUS_IDS, POLL_MAX_DURATION_MS, isPollExpired, nextPollDelay, parseStatusIds } from "./poll-schedule.ts";

test("nextPollDelay backs off 3s, 5s, then stays at 10s", () => {
  assert.deepEqual([0, 1, 2, 3, 50].map(nextPollDelay), [3000, 5000, 10000, 10000, 10000]);
});

test("isPollExpired stops after 10 minutes", () => {
  assert.equal(isPollExpired(0, POLL_MAX_DURATION_MS - 1), false);
  assert.equal(isPollExpired(0, POLL_MAX_DURATION_MS), true);
});

test("parseStatusIds accepts 1 to 20 well-formed ids", () => {
  assert.deepEqual(parseStatusIds("01JABC,01JDEF"), ["01JABC", "01JDEF"]);
  assert.deepEqual(parseStatusIds("a1,a1"), ["a1"]);
  const max = Array.from({ length: MAX_STATUS_IDS }, (_, i) => `id${i}`);
  assert.deepEqual(parseStatusIds(max.join(",")), max);
});

test("parseStatusIds rejects empty, too many or malformed ids", () => {
  assert.equal(parseStatusIds(null), null);
  assert.equal(parseStatusIds(""), null);
  assert.equal(parseStatusIds("a,,b"), null);
  assert.equal(parseStatusIds("../users"), null);
  assert.equal(parseStatusIds(Array.from({ length: MAX_STATUS_IDS + 1 }, (_, i) => `id${i}`).join(",")), null);
});
