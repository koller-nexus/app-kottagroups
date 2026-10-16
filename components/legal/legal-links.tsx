import Link from "next/link";

const LINK_CLASS =
  "inline-flex min-h-11 items-center text-sm text-kotta-muted hover:text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

/** Links para Termos e Privacidade (rodapé das telas públicas e Perfil). */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Documentos legais" className={`flex flex-wrap gap-x-6 ${className}`}>
      <Link href="/termos" className={LINK_CLASS}>
        Termos de Uso
      </Link>
      <Link href="/privacidade" className={LINK_CLASS}>
        Política de Privacidade
      </Link>
    </nav>
  );
}
