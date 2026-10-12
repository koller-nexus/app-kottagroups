export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Carregando…</span>
      <div className="h-10 w-56 rounded-control bg-kotta-overlay" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-control bg-kotta-overlay" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[132px] rounded-card border border-kotta-border bg-kotta-surface" />
        ))}
      </div>
      <div className="mt-10 h-64 rounded-card border border-kotta-border bg-kotta-surface" />
    </div>
  );
}
