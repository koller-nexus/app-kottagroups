// Regras das listas de compras, iguais às da API (nomes em runas, quantidade 1–9999).

export const MAX_SHOPPING_NAME_LENGTH = 120;
export const MAX_QUANTITY = 9999;
export const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function nameError(name: string, empty: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return empty;
  if (Array.from(trimmed).length > MAX_SHOPPING_NAME_LENGTH) {
    return `Use no máximo ${MAX_SHOPPING_NAME_LENGTH} caracteres.`;
  }
  return null;
}

export function validateListName(name: string): string | null {
  return nameError(name, "Informe um nome para a lista.");
}

export function validateItemName(name: string): string | null {
  return nameError(name, "Informe o nome do item.");
}

/** "3" → 3; vazio, decimal, zero ou acima de 9999 → null. */
export function parseQuantity(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d{1,4}$/.test(value)) return null;
  const quantity = Number(value);
  return quantity >= 1 && quantity <= MAX_QUANTITY ? quantity : null;
}

export function validateReceipt(file: { type: string; size: number }): string | null {
  if (file.size <= 0) return "Escolha um arquivo para enviar.";
  if (!RECEIPT_TYPES.includes(file.type)) return "Envie uma imagem (JPG, PNG, WebP) ou PDF.";
  if (file.size > MAX_RECEIPT_SIZE_BYTES) return "O arquivo passa de 10 MB.";
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** "3 de 5 itens", "1 de 1 item", "Nenhum item". */
export function progressLabel(completed: number, total: number): string {
  if (total === 0) return "Nenhum item";
  return `${completed} de ${total} ${total === 1 ? "item" : "itens"}`;
}
