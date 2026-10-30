import assert from "node:assert/strict";
import { test } from "node:test";
import { DISMISSED_KEY, installPromptVariant, isDismissed, isIosDevice, saveDismissed } from "./install-prompt.ts";

const base = { standalone: false, ios: false, canPrompt: false, dismissed: false, pathname: "/" };

test("app já instalado ou aviso dispensado não mostram nada", () => {
  assert.equal(installPromptVariant({ ...base, canPrompt: true, standalone: true }), null);
  assert.equal(installPromptVariant({ ...base, canPrompt: true, dismissed: true }), null);
});

test("só / e /grupos mostram o aviso", () => {
  for (const pathname of ["/entrar", "/grupos/abc/notas", "/perfil", "/convite/x"]) {
    assert.equal(installPromptVariant({ ...base, canPrompt: true, pathname }), null, pathname);
  }
  assert.equal(installPromptVariant({ ...base, canPrompt: true, pathname: "/grupos" }), "button");
});

test("com o evento do navegador, vem o botão; no iOS sem evento, a instrução", () => {
  assert.equal(installPromptVariant({ ...base, canPrompt: true }), "button");
  assert.equal(installPromptVariant({ ...base, ios: true }), "ios");
  assert.equal(installPromptVariant({ ...base, ios: true, canPrompt: true }), "button");
});

test("sem evento e sem ser iOS, não há aviso", () => {
  assert.equal(installPromptVariant(base), null);
});

test("isIosDevice reconhece iPhone, iPad com UA de Mac e descarta Mac e Android", () => {
  assert.equal(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5), true);
  assert.equal(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5), true);
  assert.equal(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0), false);
  assert.equal(isIosDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8)", 5), false);
});

test("dispensa é gravada e lida pelo mesmo armazenamento", () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.equal(isDismissed(() => storage), false);
  saveDismissed(() => storage, 1700000000000);
  assert.equal(data.get(DISMISSED_KEY), "1700000000000");
  assert.equal(isDismissed(() => storage), true);
});

test("armazenamento que lança não quebra: não dispensado, e gravar é ignorado", () => {
  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  };
  assert.equal(isDismissed(() => broken), false);
  assert.doesNotThrow(() => saveDismissed(() => broken, 1));
});

test("Safari com cookies bloqueados: até obter o localStorage lança, e não quebra", () => {
  const blocked = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  assert.equal(isDismissed(blocked), false);
  assert.doesNotThrow(() => saveDismissed(blocked, 1));
});
