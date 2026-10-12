export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Carregando…</span>
      <div className="h-10 w-56 rounded-control bg-kotta-border" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-control bg-kotta-border" />
      {/* Mesmo ritmo do <Page>: 32 px depois do título, blocos a 32/48 px. */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="h-48 rounded-card border border-kotta-border bg-kotta-surface" />
        <div className="h-48 rounded-card border border-kotta-border bg-kotta-surface" />
      </div>
    </div>
  );
}
