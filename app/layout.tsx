import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Kotta Groups — dividir gastos com amigos",
  description:
    "Versão web visual do Kotta Groups. O aplicativo para iPhone e Android chega em breve nas lojas.",
  icons: {
    icon: [{ url: "/kotta-app-icon-green-nobg.png", type: "image/png" }],
    apple: [{ url: "/kotta-app-icon-green-nobg.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-kotta-bg font-sans text-kotta-text">
        {children}
      </body>
    </html>
  );
}
