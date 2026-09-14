---
version: "kotta-2026-08-green"
name: "Kotta — tema verde Super Putt"
description: "Tema inspirado no site Super Putt (visual golf-premium): verde profundo #1a5c38, fundos brancos e #f7f9f8, Playfair Display para títulos e DM Sans para corpo. Adaptado para o app mobile React Native Kotta."
colors:
  primary: "#1a5c38"
  accent: "#2e8b57"
  secondary: "#1a1a1a"
  background: "#f7f9f8"
  surface: "#FFFFFF"
  light-green: "#edf7f1"
  text-primary: "#3d3d3d"
  text-secondary: "#6B7280"
  border: "#d8e6df"
typography:
  display:
    fontFamily: "Playfair Display"
    weights: [400, 500, 600, 700]
  body:
    fontFamily: "DM Sans"
    weights: [400, 500, 600, 700, 800]
  mono:
    fontFamily: "DM Mono"
    weights: [400, 500]
spacing:
  base: "8px"
  gap: "16px"
  card-padding: "24px"
rounded:
  card: "24px"
  control: "12px"
  pill: "9999px"
---
# KOTTA — design system

App de divisão de gastos em grupo (estilo Splitwise), focado no público brasileiro. Sem backend — dados mockados em memória em `src/data/mock.ts`.

Visual inspirado na referência "Super Putt" (site de golfe, verde premium) adaptado pra mobile. WebGL, motion e efeitos web da referência não se aplicam ao React Native — só a linguagem visual (cores, tipografia, radius).

## Cores

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#1a5c38` | verde profundo — botões, FAB, chips ativos, destaques |
| `accent` | `#2e8b57` | verde médio — variações e rótulos |
| `light-green` | `#edf7f1` | badges, círculos, fundos suaves |
| `background` | `#f7f9f8` | fundo de telas (quase branco) |
| `surface` | `#FFFFFF` | cards / painéis |
| `text-primary` | `#3d3d3d` | texto principal |
| `text-secondary` | `#6B7280` | texto secundário |
| `border` | `#d8e6df` | bordas de cards e controles |

Semânticos: `success #1a5c38` (recebe), `danger #C93A3A` (deve) com fundos `#edf7f1` e `rgba(201,58,58,0.10)`.

## Tipografia

- Display (títulos, nome do app): **Playfair Display** (700).
- Corpo: **DM Sans** (400–800).
- Labels e valores monetários: **DM Mono** (metadados técnicos).

## Layout

- Fundo `#f7f9f8` com cards brancos (`surface`) e borda `#d8e6df` sutil.
- Radius: card `24px`, control `12px`, pill `9999px`. Botões/cards/badges alinhados na mesma linguagem de radius.
- Headers e tab bar brancos, status bar escura.
- Botões/FAB: `primary` com texto branco.

## Estrutura de telas (Expo Router)

| Rota | Tela |
|---|---|
| `app/index.tsx` | Dashboard: topo com botões Entrar/Cadastrar, stats (saldo, recebe, deve, grupos) e listagem dos grupos |
| `app/auth.tsx` | Auth modal: segmented "Entrar / Cadastrar", formulários de login e cadastro |
| `app/(tabs)/_layout.tsx` | Tabs: Grupos + Perfil |
| `app/(tabs)/groups.tsx` | Lista de grupos; card com emoji, nome, nº membros, chip de saldo; FAB (+) |
| `app/(tabs)/profile.tsx` | Avatar (foto), nome, chave Pix, logout |
| `app/group/[id].tsx` | Detalhe: sub-abas "Despesas" e "Saldos"; FAB para nova despesa |
| `app/group/add-expense.tsx` | Modal nova despesa |
| `app/new-group.tsx` | Modal novo grupo |
| `app/group/edit.tsx` | Modal editar grupo |
| `app/group/manage-members.tsx` | Modal gerenciar membros do grupo |
| `app/group/shopping-list.tsx` | Modal lista de compras e recibos |
| `app/categories.tsx` | Lista de categorias padrão e personalizadas |
| `app/category/edit.tsx` | Modal criar/editar categoria personalizada |
| `app/notifications.tsx` | Modal notificações |
| `app/profile-edit.tsx` | Modal editar perfil |

## Requisitos técnicos

- TypeScript estrito, `tsc --noEmit` limpo.
- Componentes reutilizáveis: `Avatar` (foto ou iniciais + cor), `BalanceChip` (chip de saldo colorido).
- Tema central `src/theme.ts`.
- Valores monetários sempre em centavos (`amountCents: number`), formatados com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.
- `// TODO:` nos pontos onde futuramente entraria API real (login, criar despesa, criar grupo).
- Interface em pt-BR.
