import type { Metadata } from "next";
import { privacy } from "@/content/legal/privacy-2026-10";
import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Política de Privacidade — Kotta Groups",
};

export default function PrivacidadePage() {
  return <LegalDocument title="Política de Privacidade" document={privacy} />;
}
