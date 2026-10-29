import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

// Carrega o sw.js real num `self` falso e devolve os handlers e o que ele fez com o cache.
function loadWorker({ fetchImpl = async () => new Response("rede") } = {}) {
  const handlers = {};
  const log = { opened: [], added: [], puts: 0, deleted: [], skipWaiting: 0, claimed: 0, existing: [] };
  const cache = {
    addAll: async (files) => log.added.push(...files),
    put: async () => {
      log.puts += 1;
    },
  };
  const self = {
    addEventListener: (type, handler) => {
      handlers[type] = handler;
    },
    skipWaiting: () => {
      log.skipWaiting += 1;
    },
    clients: {
      claim: async () => {
        log.claimed += 1;
      },
    },
  };
  const caches = {
    open: async (name) => {
      log.opened.push(name);
      return cache;
    },
    keys: async () => log.existing,
    delete: async (name) => log.deleted.push(name),
    match: async (url) => new Response(`cache:${url}`),
  };
  vm.runInNewContext(source, { self, caches, fetch: fetchImpl, Response, URL });
  return { handlers, log };
}

// Dispara um evento com waitUntil/respondWith e devolve o que cada um recebeu.
async function dispatch(handler, event = {}) {
  let waited;
  let responded;
  handler({
    ...event,
    waitUntil: (promise) => {
      waited = promise;
    },
    respondWith: (promise) => {
      responded = promise;
    },
  });
  if (waited) await waited;
  return { responded: responded && (await responded), didRespond: responded !== undefined };
}

test("install guarda só os quatro arquivos da página offline e assume o controle", async () => {
  const { handlers, log } = loadWorker();
  await dispatch(handlers.install);
  assert.deepEqual(log.opened, ["kotta-offline-v1"]);
  assert.deepEqual(log.added, ["/offline.html", "/offline.css", "/offline.js", "/icons/icon-192.png"]);
  assert.equal(log.skipWaiting, 1);
});

test("activate apaga caches antigos do Kotta e mantém o atual e os de outros", async () => {
  const { handlers, log } = loadWorker();
  log.existing = ["kotta-offline-v0", "kotta-offline-v1", "outro-cache"];
  await dispatch(handlers.activate);
  assert.deepEqual(log.deleted, ["kotta-offline-v0"]);
  assert.equal(log.claimed, 1);
});

test("navegação com rede devolve a resposta da rede e não guarda nada", async () => {
  const { handlers, log } = loadWorker();
  const { responded } = await dispatch(handlers.fetch, { request: { mode: "navigate", url: "https://kotta.test/grupos" } });
  assert.equal(await responded.text(), "rede");
  assert.equal(log.puts, 0);
});

test("navegação sem rede devolve a página offline do cache", async () => {
  const { handlers } = loadWorker({
    fetchImpl: async () => {
      throw new TypeError("Failed to fetch");
    },
  });
  const { responded } = await dispatch(handlers.fetch, { request: { mode: "navigate", url: "https://kotta.test/grupos" } });
  assert.equal(await responded.text(), "cache:/offline.html");
});

test("resposta 500 é repassada, não vira página offline", async () => {
  const { handlers } = loadWorker({ fetchImpl: async () => new Response("erro", { status: 500 }) });
  const { responded } = await dispatch(handlers.fetch, { request: { mode: "navigate", url: "https://kotta.test/" } });
  assert.equal(responded.status, 500);
});

test("os arquivos da página offline saem do cache, sem passar pela rede", async () => {
  const { handlers } = loadWorker({
    fetchImpl: async () => {
      throw new TypeError("Failed to fetch");
    },
  });
  for (const path of ["/offline.css", "/offline.js", "/icons/icon-192.png"]) {
    const { responded } = await dispatch(handlers.fetch, {
      request: { mode: "no-cors", url: `https://kotta.test${path}` },
    });
    assert.equal(await responded.text(), `cache:${path}`, path);
  }
});

test("outras requisições que não são navegação não passam pelo service worker", async () => {
  const { handlers } = loadWorker();
  for (const request of [
    { mode: "cors", url: "https://kotta.test/api/v1/groups" },
    { mode: "same-origin", url: "https://kotta.test/_next/static/chunk.js" },
    { mode: "no-cors", url: "https://kotta.test/foto.jpg" },
  ]) {
    const { didRespond } = await dispatch(handlers.fetch, { request });
    assert.equal(didRespond, false, request.url);
  }
});
