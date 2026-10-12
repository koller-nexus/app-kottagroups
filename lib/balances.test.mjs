import assert from "node:assert/strict";
import { test } from "node:test";
import { computeNetBalances, simplifyDebts, splitEvenly } from "./balances.ts";

test("splitEvenly keeps the total and spreads the remainder", () => {
  const shares = splitEvenly(1000, 3);
  assert.deepEqual(shares, [334, 333, 333]);
  assert.equal(shares.reduce((sum, value) => sum + value, 0), 1000);
});

test("splitEvenly returns no shares for zero people", () => {
  assert.deepEqual(splitEvenly(1000, 0), []);
});

test("computeNetBalances sums to zero", () => {
  const net = computeNetBalances(
    ["a", "b", "c"],
    [
      { paidById: "a", amountCents: 9000, splitAmong: ["a", "b", "c"] },
      { paidById: "b", amountCents: 1001, splitAmong: ["a", "b", "c"] },
    ],
  );
  assert.equal(net.a + net.b + net.c, 0);
  assert.equal(net.a, 9000 - 3000 - 334);
});

test("simplifyDebts settles every balance", () => {
  const net = { a: 5000, b: -3000, c: -2000, d: 0 };
  const transfers = simplifyDebts(net);
  const after = { ...net };
  for (const t of transfers) {
    after[t.fromId] += t.amountCents;
    after[t.toId] -= t.amountCents;
  }
  assert.deepEqual(after, { a: 0, b: 0, c: 0, d: 0 });
  assert.equal(transfers.length, 2);
});

test("simplifyDebts returns nothing when everyone is settled", () => {
  assert.deepEqual(simplifyDebts({ a: 0, b: 0 }), []);
});
