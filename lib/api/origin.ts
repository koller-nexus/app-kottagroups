// Sem server-only: não lê segredo, e o next.config.ts e o proxy também precisam dela.
export function apiOrigin(): string {
  return (process.env.API_ORIGIN ?? "https://api.kottagroups.com.br").replace(/\/$/, "");
}
