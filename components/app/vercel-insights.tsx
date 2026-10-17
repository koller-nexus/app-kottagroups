"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactInviteUrl } from "@/lib/invites";

// O link do convite carrega um segredo: o painel da Vercel só vê `/convite/[token]`.
export function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: redactInviteUrl(event.url) })} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: redactInviteUrl(event.url) })} />
    </>
  );
}
