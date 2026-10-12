import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_ORIGIN ?? "https://api.kottagroups.com.br"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  experimental: {
    // Comprovantes e notas fiscais vão até 10 MiB na API.
    serverActions: { bodySizeLimit: "11mb" },
  },
  // O painel agora vive em "/"; mantém links antigos funcionando.
  async redirects() {
    return [{ source: "/painel", destination: "/", permanent: false }];
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
