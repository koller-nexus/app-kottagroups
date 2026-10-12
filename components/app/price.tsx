import { formatBRL } from "@/lib/money";

interface PriceProps {
  cents: number;
  /** Tamanho dos reais em px; R$ e centavos ficam com metade. */
  size?: number;
  className?: string;
  sign?: "+" | "−";
  /** Valor quitado: esmaece e ganha risco. */
  settled?: boolean;
}

export function splitCents(cents: number): { reais: string; centavos: string } {
  const [reais, centavos] = formatBRL(Math.abs(cents)).replace(/^R\$\s?/, "").split(",");
  return { reais, centavos: centavos ?? "00" };
}

/** Valor em reais como no app: reais grandes e leves, R$ e centavos menores. */
export function Price({ cents, size = 20, className = "", sign, settled = false }: PriceProps) {
  const { reais, centavos } = splitCents(cents);
  const small = Math.max(11, Math.round(size * 0.5));
  // Peso 300 fica fino demais abaixo de 20px.
  const reaisWeight = size >= 20 ? "font-light" : "font-medium";
  const label = `${sign === "−" ? "menos " : ""}${formatBRL(Math.abs(cents))}${settled ? ", pago" : ""}`;

  return (
    <span
      aria-label={label}
      role="img"
      className={`inline-block whitespace-nowrap tabular-nums transition-opacity duration-300 ${
        settled ? "text-kotta-muted line-through opacity-55" : ""
      } ${className}`}
    >
      <span aria-hidden="true" className="font-medium" style={{ fontSize: small }}>
        {`${sign ? `${sign} ` : ""}R$ `}
      </span>
      <span
        aria-hidden="true"
        className={reaisWeight}
        style={{ fontSize: size, letterSpacing: size >= 32 ? "-0.02em" : undefined }}
      >
        {reais}
      </span>
      <span aria-hidden="true" className="font-medium" style={{ fontSize: small }}>
        ,{centavos}
      </span>
    </span>
  );
}
