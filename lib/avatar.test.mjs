import assert from "node:assert/strict";
import { test } from "node:test";
import { AVATAR_MAX_BYTES, avatarFileProblem } from "./avatar.ts";

const INVALID = "Use uma foto JPG, PNG ou WebP de até 5 MB";

test("sem arquivo pede para escolher uma foto", () => {
  assert.equal(avatarFileProblem(null), "Escolha uma foto.");
  assert.equal(avatarFileProblem({ type: "image/jpeg", size: 0 }), "Escolha uma foto.");
});

test("recusa tipo fora da lista e arquivo acima de 5 MB", () => {
  assert.equal(avatarFileProblem({ type: "image/gif", size: 1000 }), INVALID);
  assert.equal(avatarFileProblem({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 }), INVALID);
});

test("aceita JPG, PNG e WebP de até 5 MB", () => {
  assert.equal(AVATAR_MAX_BYTES, 5 * 1024 * 1024);
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(avatarFileProblem({ type, size: AVATAR_MAX_BYTES }), null);
  }
});
