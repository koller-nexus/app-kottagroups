"use client";

export function LoadError({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-card border border-kotta-border bg-kotta-surface p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-kotta-secondary">
        Não foi possível carregar seus dados
      </h1>
      <p className="mt-3 text-sm text-kotta-muted">
        O Kotta Groups não respondeu agora. Verifique sua conexão e tente de novo.
      </p>
      <button type="button" onClick={() => retry()} className="primary-action mt-6">
        Tentar de novo
      </button>
    </div>
  );
}
