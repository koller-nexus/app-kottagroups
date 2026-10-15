"use client";

/** "Voltar" do navegador; num link direto (sem histórico) vai para `fallbackHref`. */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  return (
    <button
      type="button"
      className="secondary-action"
      onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign(fallbackHref))}
    >
      Voltar
    </button>
  );
}
