// Navegadores descartam TAB/LF/CR e tratam "\" como "/": "/\t/x" vira "//x", outra origem.
const UNSAFE_CHARS = /[\u0000-\u001f\u007f\\]/;
const PROBE_ORIGIN = "http://n.invalid";

/** Aceita só caminhos internos ("/grupos/x"), nunca outra origem. Devolve o caminho normalizado. */
export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || UNSAFE_CHARS.test(value)) return fallback;
  const base = new URL(PROBE_ORIGIN);
  const url = new URL(value, base);
  if (url.origin !== base.origin) return fallback;
  const path = `${url.pathname}${url.search}${url.hash}`;
  // "/.//x" normaliza para "//x", que vira outra origem ao ser resolvido de novo.
  return path.startsWith("//") ? fallback : path;
}
