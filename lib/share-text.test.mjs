import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGroupSummaryShareText, buildSettlementShareText, buildWhatsAppShareUrl } from "./share-text.ts";

const base = {
  groupName: "Churrasco",
  groupUrl: "https://app.kotta.com/grupos/g1",
  payerName: "Ana",
  payeeName: "Bruno",
  amountCents: 5000,
};

test("buildSettlementShareText inclui a chave Pix quando cadastrada", () => {
  const text = buildSettlementShareText({ ...base, payeePixKey: "bruno@pix.com" });
  assert.match(text, /Ana/);
  assert.match(text, /Bruno/);
  assert.match(text, /50,00/);
  assert.match(text, /bruno@pix\.com/);
  assert.match(text, /https:\/\/app\.kotta\.com\/grupos\/g1/);
});

test("buildSettlementShareText omite a chave Pix quando ausente, null ou vazia", () => {
  for (const payeePixKey of [undefined, null, ""]) {
    const text = buildSettlementShareText({ ...base, payeePixKey });
    assert.doesNotMatch(text.toLowerCase(), /pix/);
  }
});

test("buildGroupSummaryShareText lista cada par devedor/credora pendente", () => {
  const text = buildGroupSummaryShareText({
    groupName: base.groupName,
    groupUrl: base.groupUrl,
    pendingSettlements: [
      { payerName: "Ana", payeeName: "Bruno", amountCents: 5000, payeePixKey: "bruno@pix.com" },
      { payerName: "Carla", payeeName: "Diego", amountCents: 1200 },
    ],
  });
  assert.match(text, /Ana/);
  assert.match(text, /Bruno/);
  assert.match(text, /50,00/);
  assert.match(text, /bruno@pix\.com/);
  assert.match(text, /Carla/);
  assert.match(text, /Diego/);
  assert.match(text, /12,00/);
});

test("buildGroupSummaryShareText sem acertos pendentes diz que o grupo está quite", () => {
  const text = buildGroupSummaryShareText({
    groupName: base.groupName,
    groupUrl: base.groupUrl,
    pendingSettlements: [],
  });
  assert.match(text, /quite/i);
  assert.doesNotMatch(text, /paga/);
});

test("buildWhatsAppShareUrl monta o link wa.me com o texto percent-encoded", () => {
  const url = buildWhatsAppShareUrl("Ana paga Bruno R$ 50,00");
  assert.match(url, /^https:\/\/wa\.me\/\?text=/);
  assert.match(url, /%20/);
  assert.doesNotMatch(url, /\+/);
});
