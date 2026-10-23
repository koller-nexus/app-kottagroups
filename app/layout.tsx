import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import { connection } from "next/server";
import { VercelInsights } from "@/components/app/vercel-insights";
import "./globals.css";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Kotta Groups — dividir gastos com amigos",
  description:
    "Divida os gastos da viagem, da casa e do churrasco sem fazer conta de cabeça.",
  icons: {
    icon: [{ url: "/kotta-app-icon-green-nobg.png", type: "image/png" }],
    apple: [{ url: "/kotta-app-icon-green-nobg.png", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // O nonce da CSP muda a cada requisição: uma página pré-gerada sairia sem ele e com todos os
  // scripts bloqueados.
  await connection();
  return (
    <html
      lang="pt-BR"
      className={`${dmMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-kotta-bg font-sans text-kotta-text">
        {children}
        <VercelInsights />
      </body>
    </html>
  );
}
