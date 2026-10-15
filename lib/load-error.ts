/** Prefixo do `digest` de ApiError quando a API não respondeu; o Next repassa o digest ao cliente. */
export const API_UNAVAILABLE_DIGEST = "API_UNAVAILABLE:";

export type LoadErrorKind = "offline" | "unavailable" | "unexpected";

export function loadErrorKind({ digest, isOnline }: { digest?: string; isOnline: boolean }): LoadErrorKind {
  if (!isOnline) return "offline";
  if (digest?.startsWith(API_UNAVAILABLE_DIGEST)) return "unavailable";
  return "unexpected";
}
