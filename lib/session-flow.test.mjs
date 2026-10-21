import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accountCreatedLoginUrl,
  confirmEmailUrl,
  expiredSessionUrl,
  loginNotice,
  logoutDestination,
  signedOutLoginUrl,
} from "./session-flow.ts";

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
  for (const path of ["//exemplo.com", "https://x", "/\\x", "/\t/x", "/.//x", undefined]) {
    assert.equal(parse(expiredSessionUrl(path, "GET")).next, "/");
  }
});

test("logoutDestination manda para /entrar só quando a API recusou ou não há token", () => {
  assert.deepEqual(logoutDestination({ check: "invalid", next: "/despesas/nova?aviso=envio-nao-salvo", motivo: "envio" }), {
    location: "/entrar?motivo=envio&next=%2Fdespesas%2Fnova%3Faviso%3Denvio-nao-salvo",
    clearCookie: true,
  });
  assert.deepEqual(logoutDestination({ check: "no-token", next: "/grupos", motivo: "expirada" }), {
    location: "/entrar?motivo=expirada&next=%2Fgrupos",
    clearCookie: false,
  });
});

test("logoutDestination volta para a página quando o token vale ou a API está fora", () => {
  assert.deepEqual(logoutDestination({ check: "valid", next: "/grupos", motivo: "expirada" }), {
    location: "/grupos",
    clearCookie: false,
  });
  assert.deepEqual(logoutDestination({ check: "unknown", next: "/grupos", motivo: "expirada" }), {
    location: "/grupos",
    clearCookie: false,
  });
});

test("logoutDestination ignora motivo desconhecido e omite next raiz", () => {
  assert.equal(logoutDestination({ check: "invalid", next: "/", motivo: "saiu" }).location, "/entrar");
  assert.equal(logoutDestination({ check: "invalid", next: "/", motivo: "outro" }).location, "/entrar");
  assert.equal(logoutDestination({ check: "invalid", next: "/", motivo: null }).location, "/entrar");
});

test("after a signup whose auto login failed, login opens with the email and a notice", () => {
  assert.equal(accountCreatedLoginUrl("a+b@x.com"), "/entrar?motivo=conta-criada&email=a%2Bb%40x.com");
  assert.equal(loginNotice("conta-criada"), "Conta criada! Entre para continuar.");
  assert.equal(parse(accountCreatedLoginUrl("a@x.com", "/convite/abc")).next, "/convite/abc");
});

test("signedOutLoginUrl keeps where the person was going", () => {
  assert.equal(signedOutLoginUrl(), "/entrar?motivo=saiu");
  assert.deepEqual(parse(signedOutLoginUrl("/convite/abc")), { pathname: "/entrar", motivo: "saiu", next: "/convite/abc" });
});

test("confirmEmailUrl keeps the destination unless it is the dashboard", () => {
  assert.equal(confirmEmailUrl("/"), "/confirme-seu-email");
  assert.equal(confirmEmailUrl("/grupos/1"), "/confirme-seu-email?next=%2Fgrupos%2F1");
});

test("logout never forwards a non-expiry motivo to the login screen", () => {
  assert.equal(logoutDestination({ check: "invalid", next: "/", motivo: "conta-criada" }).location, "/entrar");
});
