import type { MetadataRoute } from "next";
import { colors } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kotta Groups",
    short_name: "Kotta Groups",
    description: "Divida os gastos da viagem, da casa e do churrasco sem fazer conta de cabeça.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    background_color: colors.background,
    theme_color: colors.primary,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
