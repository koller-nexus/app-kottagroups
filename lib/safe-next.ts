/** Aceita só caminhos internos ("/grupos/x"), nunca outra origem. */
export function safeNextPath(value: unknown, fallback = "/painel"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
