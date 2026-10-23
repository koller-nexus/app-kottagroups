// 128 bits: o exemplo do guia do Next usa randomUUID, que tem só 122 aleatórios.
const NONCE_BYTES = 16;

// Na API de desenvolvimento e do e2e, avatares e arquivos simulados saem de portas diferentes.
const LOOPBACK_SOURCES = "http://localhost:* http://127.0.0.1:*";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  return btoa(String.fromCharCode(...bytes));
}

type PolicyInput = { nonce: string; apiOrigin: string; isDev: boolean };

/** Política completa (specs/024-csp-nonce/contracts/csp-header.md). */
export function contentSecurityPolicy({ nonce, apiOrigin, isDev }: PolicyInput): string {
  const imageSources = LOOPBACK_HOSTS.has(new URL(apiOrigin).hostname)
    ? `${apiOrigin} ${LOOPBACK_SOURCES}`
    : apiOrigin;
  // 'strict-dynamic' libera o que um script com nonce cria: chunks do Next e scripts da Vercel.
  // Em dev, o React usa eval para as pilhas de erro e o overlay injeta <style> sem nonce.
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    // Atributos style= com valores calculados; blocos <style> continuam exigindo nonce.
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' blob: ${imageSources}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
