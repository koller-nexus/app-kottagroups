"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  installPromptVariant,
  isDismissed,
  isIosDevice,
  saveDismissed,
  type InstallPromptVariant,
} from "@/lib/install-prompt";

// Evento do Chrome/Edge/Android; não está nos tipos do DOM.
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

// Três flags em texto (standalone, iOS, dispensado) para o snapshot ser comparável por valor.
function readBrowserFlags(): string {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = isIosDevice(navigator.userAgent, navigator.maxTouchPoints);
  return [standalone, ios, isDismissed(() => localStorage)].map(Number).join("");
}

const subscribeNothing = () => () => {};
const serverFlags = () => null;

const TEXT: Record<InstallPromptVariant, string> = {
  button: "Instale o Kotta Groups na sua tela inicial para abrir mais rápido.",
  ios: "Para instalar, toque em Compartilhar e depois em Adicionar à Tela de Início.",
};

const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-control px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary";

export function InstallPrompt() {
  const pathname = usePathname();
  // Lido só no cliente: o servidor não sabe nada disto e renderiza sem o aviso.
  const flags = useSyncExternalStore(subscribeNothing, readBrowserFlags, serverFlags);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissedNow, setDismissedNow] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (flags === null) return null;
  const variant = installPromptVariant({
    standalone: flags[0] === "1",
    ios: flags[1] === "1",
    dismissed: flags[2] === "1" || dismissedNow,
    canPrompt: installEvent !== null,
    pathname,
  });
  if (!variant) return null;

  function dismiss() {
    saveDismissed(() => localStorage, Date.now());
    setDismissedNow(true);
  }

  async function install() {
    if (!installEvent) return;
    // O evento só vale uma vez; depois da escolha o navegador não oferece de novo.
    setInstallEvent(null);
    await installEvent.prompt();
  }

  return (
    <section
      aria-label="Instalar o Kotta Groups"
      className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto flex max-w-md flex-col gap-3 rounded-card border border-kotta-border bg-kotta-surface p-4 text-kotta-text shadow-lg lg:bottom-4 lg:left-auto lg:right-4"
    >
      <p className="text-sm">{TEXT[variant]}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={dismiss} className={`${BUTTON_CLASS} text-kotta-muted hover:bg-kotta-overlay`}>
          Agora não
        </button>
        {variant === "button" ? (
          <button type="button" onClick={install} className={`${BUTTON_CLASS} bg-kotta-primary text-white hover:bg-kotta-primary-deep`}>
            Instalar
          </button>
        ) : null}
      </div>
    </section>
  );
}
