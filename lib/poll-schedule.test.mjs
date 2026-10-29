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

const ULID_A = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ULID_B = "7ZZZZZZZZZZZZZZZZZZZZZZZZZ";
/** `count` ULIDs distintos: prefixo fixo de 24 caracteres + 2 dígitos. */
const ulids = (count) => Array.from({ length: count }, (_, i) => `01JABCDEFGHJKMNPQRSTVWXY${String(i).padStart(2, "0")}`);

test("parseStatusIds accepts 1 to 20 canonical ULIDs", () => {
  assert.deepEqual(parseStatusIds(ULID_A), [ULID_A]);
  assert.deepEqual(parseStatusIds(`${ULID_B},${ULID_A},${ULID_B}`), [ULID_B, ULID_A]);
  const max = ulids(MAX_STATUS_IDS);
  assert.deepEqual(parseStatusIds(max.join(",")), max);
});

test("parseStatusIds rejects empty, too many or non-canonical ids", () => {
  for (const raw of [
    null,
    "",
    `${ULID_A},,${ULID_B}`,
    "../users",
    ULID_A.toLowerCase(),
    ULID_A.slice(1),
    `${ULID_A}0`,
    ...["I", "L", "O", "U"].map((letter) => `${ULID_A.slice(0, -1)}${letter}`),
    `8${ULID_A.slice(1)}`,
    `Z${ULID_A.slice(1)}`,
    ulids(MAX_STATUS_IDS + 1).join(","),
  ]) {
    assert.equal(parseStatusIds(raw), null, String(raw));
  }
});
