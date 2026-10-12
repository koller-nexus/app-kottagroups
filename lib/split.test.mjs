import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCustomSplit } from "./split.ts";

test("aceita divisão que fecha com o total e ignora zeros", () => {
  assert.deepEqual(parseCustomSplit({ a: "10,00", b: "5", c: "", d: "0" }, 1500), {
    split: { a: 1000, b: 500 },
  });
});

test("bloqueia soma menor ou maior que o total", () => {
  assert.deepEqual(parseCustomSplit({ a: "10" }, 1500), { error: "Faltam R$ 5,00 na divisão." });
  assert.deepEqual(parseCustomSplit({ a: "20" }, 1500), { error: "Sobram R$ 5,00 na divisão." });
});

test("recusa valor inválido", () => {
  assert.ok("error" in parseCustomSplit({ a: "abc" }, 100));
});
