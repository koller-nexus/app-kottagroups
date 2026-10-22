import assert from "node:assert/strict";
import { test } from "node:test";
import { httpsUrl } from "./https-url.ts";

test("httpsUrl keeps only https, or http on loopback", () => {
  const kept = [
    "https://cdn.x/a.jpg",
    "HTTPS://cdn.x/a.jpg",
    "http://localhost:8085/api/v1/avatars/a.png",
    "http://127.0.0.1/a.jpg",
    "http://[::1]:8085/a.jpg",
  ];
  for (const value of kept) assert.equal(httpsUrl(value), value, value);

  const dropped = [
    "http://cdn.x/a.jpg",
    "http://localhost.evil.com/a.jpg",
    "ftp://localhost/a.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "/relativo.jpg",
    "não é url",
    null,
    undefined,
    "",
  ];
  for (const value of dropped) assert.equal(httpsUrl(value), undefined, String(value));
});
