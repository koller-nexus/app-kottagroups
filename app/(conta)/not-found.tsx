import Link from "next/link";
import { BackButton } from "@/components/app/back-button";
import { ErrorState } from "@/components/app/error-state";

// `notFound()` de grupo, despesa, lista, nota ou categoria. As páginas tratam 403 como 404
// de propósito, para não revelar se o item existe. Cabeçalho e abas vêm do layout.
export default function ContaNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-8">
      <ErrorState
        kind="not-found"
        text="Esse item não existe ou você não tem acesso a ele."
        primary={
          <Link href="/" className="primary-action">
            Ir para o Painel
          </Link>
        }
        secondary={<BackButton fallbackHref="/" />}
      />
    </div>
  );
}
