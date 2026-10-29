export const DISMISSED_KEY = "kotta:install-dismissed:v1";
// Só nas telas de entrada do app; fluxos de envio de nota e pagamento ficam de fora.
export const PROMPT_PATHS = ["/", "/grupos"];

type VariantInput = {
  standalone: boolean;
  ios: boolean;
  canPrompt: boolean;
  dismissed: boolean;
  pathname: string;
};

export type InstallPromptVariant = "button" | "ios";

export function installPromptVariant({
  standalone,
  ios,
  canPrompt,
  dismissed,
  pathname,
}: VariantInput): InstallPromptVariant | null {
  if (standalone || dismissed || !PROMPT_PATHS.includes(pathname)) return null;
  if (canPrompt) return "button";
  return ios ? "ios" : null;
}

/** iPadOS 13+ se apresenta como Mac, então um "Mac" com toque é iPad. */
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

// Recebem uma função, não o Storage: no Safari com cookies bloqueados só ler `localStorage` já lança,
// então o acesso precisa acontecer dentro do try. Bloqueado ou cheio conta como "não dispensado".
export function isDismissed(getStorage: () => Pick<Storage, "getItem">): boolean {
  try {
    return getStorage().getItem(DISMISSED_KEY) !== null;
  } catch {
    return false;
  }
}

export function saveDismissed(getStorage: () => Pick<Storage, "setItem">, now: number): void {
  try {
    getStorage().setItem(DISMISSED_KEY, String(now));
  } catch {
    // Sem onde gravar, o aviso só volta na próxima visita.
  }
}
