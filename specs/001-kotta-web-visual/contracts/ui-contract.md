# UI Contract: Public landing (`/`)

There is no HTTP API for this feature. The contract is the document the page MUST satisfy.

## Route

| Method | Path | Auth | Result |
|--------|------|------|--------|
| GET | `/` | none | HTML of the Kotta public home |

No other product routes in this delivery (`/auth`, `/groups`, `/profile`, `/group/*` MUST NOT exist as app features).

## Section order (top → bottom)

1. Header: brand **Kotta Groups** + store badges (badges may wrap below the name)
2. Tagline
3. Stats grid — four cards, labels exactly:
   - `SEU SALDO`
   - `VOCÊ RECEBE`
   - `VOCÊ DEVE`
   - `GRUPOS`
4. Block title `GASTOS DOS GRUPOS` with two bars: `mês passado`, `este mês`
5. Block title `ÚLTIMAS QUITAÇÕES` then rows or empty copy
6. Block title `SEUS GRUPOS` then group rows

## Forbidden copy and controls

MUST NOT appear anywhere on `/`:

- `Entrar`
- `Cadastrar`
- email / password fields
- Next.js / Vercel scaffold CTAs

## Store badges

- Two controls: Apple App Store, Google Play
- Each shows **Em breve**
- Accessible names include the store and “em breve”
- Activate (click/keyboard): stay on `/`; no new document, no store URL

## Group rows

- Show emoji, name, member count (`N membro` / `N membros`), balance chip
- Not a navigation target (no `href` to a group resource)

## Money

- Format: Brazilian real, from integer cents (e.g. 32050 → `R$ 320,50`)
- Positive receive styling vs negative owe styling per Kotta (green vs red)

## Theme

- Document language `pt-BR`
- Light Kotta tokens only (no dark-mode inversion of the landing)

## Metadata

- Title and description identify Kotta Groups (not “Create Next App”)
