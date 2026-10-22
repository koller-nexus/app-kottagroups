"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactAnalyticsUrl } from "@/lib/invites";

// Links carregam segredos: o convite no caminho (e em `?next=` de entrar/cadastrar) e os tokens de
// redefinição e confirmação em `?token=`. O painel da Vercel só vê o caminho, com `/convite/[token]`.
export function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: redactAnalyticsUrl(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: redactAnalyticsUrl(event.url) })} />
    </>
  );
}
