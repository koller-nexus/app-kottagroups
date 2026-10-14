import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_ORIGIN ?? "https://api.kottagroups.com.br"
).replace(/\/$/, "");

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
    ];
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
