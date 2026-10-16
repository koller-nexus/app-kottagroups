import type { Metadata } from "next";
import { terms } from "@/content/legal/terms-2026-10";
import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Termos de Uso — Kotta Groups",
};

export default function TermosPage() {
  return <LegalDocument title="Termos de Uso" document={terms} />;
}
