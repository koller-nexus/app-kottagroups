import assert from "node:assert/strict";
import { test } from "node:test";
import { expiredSessionUrl, loginNotice } from "./session-flow.ts";

function parse(url) {
  const parsed = new URL(url, "http://kotta.test");
  return { pathname: parsed.pathname, motivo: parsed.searchParams.get("motivo"), next: parsed.searchParams.get("next") };
}

test("loginNotice maps each motivo to its text", () => {
  assert.equal(loginNotice("saiu"), "Você saiu da conta.");
  assert.equal(loginNotice("expirada"), "Sua sessão expirou. Entre de novo para continuar.");
  assert.equal(loginNotice("envio"), "Sua sessão expirou. Entre de novo para continuar.");
});

test("loginNotice ignores unknown motivo", () => {
  assert.equal(loginNotice("outro"), undefined);
  assert.equal(loginNotice(undefined), undefined);
});

test("expiredSessionUrl keeps the page on a read", () => {
  assert.deepEqual(parse(expiredSessionUrl("/notas", "GET")), {
    pathname: "/sair",
    motivo: "expirada",
    next: "/notas",
  });
});

test("expiredSessionUrl marks a lost submit on a write", () => {
  assert.deepEqual(parse(expiredSessionUrl("/despesas/nova", "POST")), {
    pathname: "/sair",
    motivo: "envio",
    next: "/despesas/nova?aviso=envio-nao-salvo",
  });
  assert.equal(
    parse(expiredSessionUrl("/grupos/1?aba=saldos", "PATCH")).next,
    "/grupos/1?aba=saldos&aviso=envio-nao-salvo",
  );
});

test("expiredSessionUrl falls back to / for unsafe paths", () => {
  for (const path of ["//exemplo.com", "https://x", "/\\x", undefined]) {
    assert.equal(parse(expiredSessionUrl(path, "GET")).next, "/");
  }
});
