"use client";

import { useEffect } from "react";

// Registra o service worker de specs/029-pwa-installable. Só em produção: em dev ele deixaria
// páginas velhas presas. Não pede permissão nem mostra nada; é a base para as notificações (B13).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Falha de registro não pode afetar o site: ele só fica sem a página "Sem conexão".
      });
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
