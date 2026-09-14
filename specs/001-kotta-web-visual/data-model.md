# Data Model: Kotta Web Visual Landing

Display-only snapshot. No persistence, no identity, no mutations.

## LandingSnapshot

Root object imported by the home page.

| Field | Type | Rules |
|-------|------|--------|
| tagline | string | PT-BR; matches public home meaning (“Dividir gastos com amigos nunca foi tão fácil.”) |
| balances | BalanceSnapshot | Required |
| monthSpend | MonthSpend | Required |
| settlements | Settlement[] | 0–3 items for the “últimas quitações” block |
| groups | DemoGroup[] | ≥1 so the home is not an auth empty-state |

## BalanceSnapshot

| Field | Type | Rules |
|-------|------|--------|
| netCents | integer | Signed; ≥0 means “a receber”, <0 means “a pagar” |
| receivesCents | integer | ≥ 0 |
| owesCents | integer | ≥ 0 |
| groupCount | integer | ≥ 0; equals number of `groups` in the snapshot |

Validation: `groupCount === groups.length`. Display uses absolute value of `netCents` plus caption from the sign.

## MonthSpend

| Field | Type | Rules |
|-------|------|--------|
| previousMonthCents | integer | ≥ 0 |
| currentMonthCents | integer | ≥ 0 |

Bar fill widths are derived at render: each value over `max(previous, current, 1)` as a percentage. No stored percentage field.

## Settlement

| Field | Type | Rules |
|-------|------|--------|
| id | string | Stable unique id for list keys |
| counterpartName | string | Other person in the sentence |
| amountCents | integer | > 0 |
| direction | `"receive"` \| `"pay"` | You receive vs you pay |
| status | `"pending"` \| `"paid"` | Drives status color and label (`pendente` / `pago`) |

## DemoGroup

| Field | Type | Rules |
|-------|------|--------|
| id | string | Stable unique id |
| name | string | Non-empty |
| emoji | string | Single emoji (or short pictograph) |
| memberCount | integer | ≥ 1 |
| netCents | integer | Signed; drives BalanceChip |

## StoreBadge (UI config, not user data)

| Field | Type | Rules |
|-------|------|--------|
| store | `"app-store"` \| `"play-store"` | Exactly two instances on the home |
| label | string | Visible **Em breve** plus store name |
| href | none | MUST be absent |

## State transitions

None. The snapshot is immutable for the life of a build. Clicking badges or groups MUST NOT change fields.
