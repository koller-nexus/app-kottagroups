import { expect, test } from "@playwright/test";

// specs/023-reaudit-run2-hardening/contracts/security-headers.md
const SECURITY_HEADERS = {
  "content-security-policy": "frame-ancestors 'none'",
  "x-frame-options": "DENY",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

// Página e arquivo de /public; o status não importa (um redirect também precisa dos cabeçalhos).
for (const path of ["/entrar", "/kotta-icon.png"]) {
  test(`cabeçalhos de segurança em ${path}`, async ({ request }) => {
    const headers = (await request.get(path, { maxRedirects: 0 })).headers();
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(headers[name], name).toBe(value);
    }
  });
}

// No proxy valem os cabeçalhos da própria API (CSP mais restrita, HSTS dela): basta existirem
// e o framing continuar bloqueado.
test("cabeçalhos de segurança no proxy da API", async ({ request }) => {
  const headers = (await request.get("/api/v1/users/me", { maxRedirects: 0 })).headers();
  for (const name of Object.keys(SECURITY_HEADERS)) expect(headers[name], name).toBeTruthy();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
});
