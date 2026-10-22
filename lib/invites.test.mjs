import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inviteReturnPath,
  invitePageState,
  isInviteTokenShape,
  parseInviteForm,
  qrSvgPath,
  redactAnalyticsUrl,
  splitInvites,
} from "./invites.ts";

const TOKEN = "q3K9xZ_-abcdefghijklmnopqrstuvwxyz012345678"; // 43, como a API gera

test("formato do token: base64url de tamanho razoável", () => {
  assert.equal(isInviteTokenShape(TOKEN), true);
  assert.equal(isInviteTokenShape("abc"), false);
  assert.equal(isInviteTokenShape("a".repeat(257)), false);
  assert.equal(isInviteTokenShape(`${TOKEN.slice(0, 20)}/x`), false);
  assert.equal(isInviteTokenShape(`${TOKEN.slice(0, 20)}.x`), false);
  assert.equal(isInviteTokenShape(`${TOKEN.slice(0, 20)} x`), false);
  assert.equal(isInviteTokenShape(undefined), false);
});

test("retorno ao convite é codificado", () => {
  assert.equal(inviteReturnPath(TOKEN), `/convite/${TOKEN}`);
  assert.equal(inviteReturnPath("a b"), "/convite/a%20b");
});

test("analytics não recebe o token", () => {
  const cases = [
    ["https://x.com/convite/abc?y=1", "https://x.com/convite/[token]"],
    [`https://x.com/entrar?next=%2Fconvite%2F${TOKEN}`, "https://x.com/entrar"],
    [`https://x.com/cadastrar?next=%2Fconvite%2F${TOKEN}`, "https://x.com/cadastrar"],
    ["https://x.com/redefinir-senha?token=X", "https://x.com/redefinir-senha"],
    ["https://x.com/confirmar-email?token=X#a", "https://x.com/confirmar-email"],
    ["https://x.com/grupos/1?aba=saldos", "https://x.com/grupos/1"],
    ["https://x.com/", "https://x.com/"],
  ];
  for (const [url, expected] of cases) assert.equal(redactAnalyticsUrl(url), expected, url);
});

test("estado da página do convite", () => {
  const base = { tokenOk: true, hasSession: false };
  assert.equal(invitePageState({ ...base, tokenOk: false }), "invalid");
  assert.equal(invitePageState({ ...base, previewErrorCode: "INVITE_INVALID" }), "invalid");
  assert.equal(invitePageState({ ...base, hasSession: true, erro: "INVITE_INVALID" }), "invalid");
  assert.equal(invitePageState(base), "guest");
  assert.equal(invitePageState({ ...base, hasSession: true }), "member-ready");
  assert.equal(invitePageState({ ...base, previewErrorCode: "NETWORK_ERROR" }), "error");
  assert.equal(invitePageState({ ...base, previewErrorCode: "RATE_LIMITED" }), "error");
  assert.equal(invitePageState({ ...base, hasSession: true, erro: "RATE_LIMITED" }), "member-ready");
});

test("e-mail diferente pede troca de conta", () => {
  assert.equal(invitePageState({ tokenOk: true, hasSession: true, erro: "INVITE_EMAIL_MISMATCH" }), "email-mismatch");
});

test("formulário vazio = uso único por 7 dias", () => {
  assert.deepEqual(parseInviteForm({}), {
    input: { email: null, maxUses: 1, expiresInHours: 168 },
    errors: {},
  });
});

test("e-mail: formato, espaços e sempre uso único", () => {
  assert.equal(parseInviteForm({ email: "nao-e-email" }).errors.email, "Informe um e-mail válido.");
  const ok = parseInviteForm({ email: "  ana@exemplo.com ", audience: "many", maxUses: "3" });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.input.email, "ana@exemplo.com");
  assert.equal(ok.input.maxUses, 1);
});

test("várias pessoas: de 1 a 100, inteiro", () => {
  for (const maxUses of ["0", "101", "2.5", "abc", ""]) {
    assert.equal(
      parseInviteForm({ audience: "many", maxUses }).errors.maxUses,
      "Escolha de 1 a 100 pessoas.",
      maxUses,
    );
  }
  assert.equal(parseInviteForm({ audience: "many", maxUses: "100" }).input.maxUses, 100);
  assert.equal(parseInviteForm({ audience: "one", maxUses: "5" }).input.maxUses, 1);
});

test("validade só da lista", () => {
  assert.equal(parseInviteForm({ expiresInHours: "24" }).input.expiresInHours, 24);
  assert.equal(parseInviteForm({ expiresInHours: "48" }).errors.expiresInHours, "Escolha uma validade da lista.");
});

test("lista separa pendentes de encerrados", () => {
  const invite = (id, status, extra = {}) => ({
    id,
    groupId: "g",
    createdBy: "u1",
    email: null,
    maxUses: 1,
    uses: 0,
    expiresAt: "2026-10-24T12:00:00Z",
    revokedAt: null,
    createdAt: "2026-10-17T12:00:00Z",
    status,
    ...extra,
  });
  const { pending, closed } = splitInvites(
    [
      invite("a", "active", { email: "ana@x.com" }),
      invite("b", "exhausted"),
      invite("c", "expired", { createdBy: "saiu" }),
      invite("d", "revoked"),
      invite("e", "active"),
    ],
    new Map([["u1", "William"]]),
  );
  assert.deepEqual(pending.map((r) => [r.id, r.target, r.creatorName]), [
    ["a", "ana@x.com", "William"],
    ["e", "Link", "William"],
  ]);
  assert.deepEqual(closed.map((r) => [r.id, r.statusLabel, r.creatorName]), [
    ["b", "Usado", "William"],
    ["c", "Expirado", "Ex-membro"],
    ["d", "Revogado", "William"],
  ]);
});

test("QR: um quadrado por módulo escuro", () => {
  assert.equal(
    qrSvgPath([
      [true, false],
      [false, true],
    ]),
    "M0 0h1v1h-1zM1 1h1v1h-1z",
  );
});
