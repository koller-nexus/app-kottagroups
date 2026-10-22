const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * URL de arquivo vinda da API, só se for HTTPS. HTTP só no próprio computador, onde a API de
 * desenvolvimento e do e2e serve os arquivos.
 */
export function httpsUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol === "https:") return value;
  return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname) ? value : undefined;
}
