import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPreviewDashboard } from "./dashboard-preview.ts";

// Valores exibidos pela dashboard sem login do app mobile.
test("preview totals match the mobile dashboard", () => {
  const preview = buildPreviewDashboard();
  assert.equal(preview.receivesCents, 18036);
  assert.equal(preview.owesCents, 49163);
  assert.equal(preview.receivesCents - preview.owesCents, -31127);
});

test("preview settlements match the mobile dashboard", () => {
  const { recent } = buildPreviewDashboard();
  assert.deepEqual(
    recent.map((r) => [r.youReceive, r.otherName, r.amountCents, r.paid]),
    [
      [true, "Diego", 14013],
      [true, "Marina", 4023],
      [false, "Ana", 49163],
    ].map((r) => [...r, false]),
  );
});

test("preview groups keep the mobile order and member counts", () => {
  const { groups } = buildPreviewDashboard();
  assert.deepEqual(
    groups.map((g) => [g.name, g.memberCount]),
    [
      ["Apartamento", 3],
      ["Viagem pra Praia", 4],
      ["Churrasco de Domingo", 4],
    ],
  );
  assert.equal(groups[2].netCents, 0);
});
