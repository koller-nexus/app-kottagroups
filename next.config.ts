import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_ORIGIN ?? "https://api.kottagroups.com.br"
).replace(/\/$/, "");

// Sem eles, o framing de páginas logadas só é barrado pelo cookie SameSite=Lax (#64). Sem
// `preload` no HSTS, que é difícil de desfazer; uma CSP completa fica para outra entrega.
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  experimental: {
    // Comprovantes e notas fiscais vão até 10 MiB na API.
    serverActions: { bodySizeLimit: "11mb" },
  },
  // Links antigos: o painel vive em "/" e as notas, dentro de cada grupo.
  async redirects() {
    return [
      { source: "/painel", destination: "/", permanent: false },
      { source: "/notas", destination: "/grupos", permanent: false },
      { source: "/notas/:id", destination: "/grupos", permanent: false },
      // Links dos e-mails da API; a query (?token=…) é repassada.
      { source: "/confirm-email", destination: "/confirmar-email", permanent: false },
      { source: "/forget-password", destination: "/redefinir-senha", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
