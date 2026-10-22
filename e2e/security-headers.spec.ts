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

// /api/v1/* fica de fora: é um proxy externo, e o Next devolve só os cabeçalhos da API, que
// variam com o ambiente dela (em dev ela não manda HSTS). Esses são responsabilidade da API.
