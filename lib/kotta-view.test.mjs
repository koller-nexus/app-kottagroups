import assert from "node:assert/strict";
import { test } from "node:test";
import {
  balanceTotals,
  colorIndexFor,
  groupByMonthAndDay,
  localDay,
  monthSpend,
  parseAmountToCents,
  previousMonth,
  previousMonthStartIso,
} from "./kotta-view.ts";

test("localDay uses Brasília time", () => {
  assert.equal(localDay("2026-10-01T02:30:00Z"), "2026-09-30");
  assert.equal(localDay("2026-10-01T03:30:00Z"), "2026-10-01");
});

test("previousMonth wraps the year", () => {
  assert.equal(previousMonth("2026-01"), "2025-12");
  assert.equal(previousMonth("2026-10"), "2026-09");
});

test("previousMonthStartIso is before local midnight of day 1", () => {
  assert.equal(previousMonthStartIso("2026-10-12T15:00:00Z"), "2026-09-01T00:00:00.000Z");
});

test("monthSpend splits current and previous month", () => {
  const result = monthSpend(
    [
      { createdAt: "2026-10-05T12:00:00Z", amountCents: 1000 },
      { createdAt: "2026-10-01T02:00:00Z", amountCents: 300 }, // 30/09 em Brasília
      { createdAt: "2026-09-10T12:00:00Z", amountCents: 500 },
      { createdAt: "2026-08-10T12:00:00Z", amountCents: 9999 },
    ],
    "2026-10-12T15:00:00Z",
  );
  assert.deepEqual(result, { currentMonthCents: 1000, previousMonthCents: 800 });
});

test("balanceTotals adds what you receive and owe across groups", () => {
  const totals = balanceTotals(
    [
      [{ userId: "me", netCents: 500 }, { userId: "x", netCents: -500 }],
      [{ userId: "me", netCents: -200 }],
      [{ userId: "x", netCents: 0 }],
    ],
    "me",
  );
  assert.deepEqual(totals, { receivesCents: 500, owesCents: 200, netCents: 300 });
});

test("groupByMonthAndDay keeps order and groups by local day", () => {
  const groups = groupByMonthAndDay([
    { id: 1, createdAt: "2026-10-05T12:00:00Z" },
    { id: 2, createdAt: "2026-10-05T09:00:00Z" },
    { id: 3, createdAt: "2026-09-30T12:00:00Z" },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].month, "2026-10");
  assert.deepEqual(groups[0].days[0].items.map((i) => i.id), [1, 2]);
  assert.equal(groups[1].days[0].day, "2026-09-30");
});

test("colorIndexFor is stable and in range", () => {
  assert.equal(colorIndexFor("abc", 8), colorIndexFor("abc", 8));
  assert.ok(colorIndexFor("some-uuid", 8) < 8);
});

test("parseAmountToCents accepts Brazilian formats", () => {
  assert.equal(parseAmountToCents("1.234,56"), 123456);
  assert.equal(parseAmountToCents("12,5"), 1250);
  assert.equal(parseAmountToCents("R$ 30"), 3000);
  assert.equal(parseAmountToCents("30.50"), 3050);
  assert.equal(parseAmountToCents("1.000"), 100000);
});

test("parseAmountToCents rejects invalid or zero values", () => {
  assert.equal(parseAmountToCents(""), null);
  assert.equal(parseAmountToCents("abc"), null);
  assert.equal(parseAmountToCents("0,00"), null);
  assert.equal(parseAmountToCents("-5"), null);
  assert.equal(parseAmountToCents("1,234"), null);
});
