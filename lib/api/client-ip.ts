import { isIP } from "node:net";

// Nomes propostos para api#250 (specs/026-forward-client-ip/contracts/bff-client-ip.md).
export const CLIENT_IP_HEADER = "X-Kotta-Client-IP";
export const BFF_SECRET_HEADER = "X-Kotta-Bff-Secret";

/**
 * Cabeçalhos para a API contar o limite pelo IP do navegador, não pelo IP de saída da Vercel.
 * A borda da Vercel sobrescreve `x-real-ip`/`x-forwarded-for` com o IP da conexão, então o
 * navegador não escolhe esse valor. Vão os dois juntos ou nenhum.
 */
export function clientIpHeaders(incoming: Headers, secret: string | undefined): Record<string, string> {
  if (!secret) return {};
  const ip = (incoming.get("x-real-ip") ?? incoming.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  if (!isIP(ip)) return {};
  return { [CLIENT_IP_HEADER]: ip, [BFF_SECRET_HEADER]: secret };
}
