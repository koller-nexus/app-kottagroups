---
version: "kotta-2026-10-jardim"
name: "Kotta — Jardim"
description: "Mesmo sistema do app mobile (mobile-kottagroups/DESIGN.md): campo verde-jardim em destaque sobre fundo leaf mist, fonte da plataforma, valores leves e uma única curva."
colors:
  garden-green: "#2F6B4F"
  garden-green-deep: "#234F3B"
  leaf-field: "#DCEADF"
  on-green-muted: "#CFE3D5"
  on-green-owes: "#FFD9CC"
  leaf-mist: "#F1F4EE"
  leaf-line: "#DCE3DC"
  leaf-line-strong: "#BFCBC1"
  muted: "#56665C"
  ink: "#18211C"
  terracotta: "#A4492A"
  sand-rose: "#F6E6DE"
  white: "#FFFFFF"
typography:
  face: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, sans-serif"
  amount: { fontWeight: 300 }
  title: { fontWeight: 700 }
  body: { fontWeight: 400 }
  label: { fontSize: "13px", fontWeight: 600 }
  key: { fontFamily: "DM Mono", fontWeight: 500 }
rounded:
  card: "16px"
  control: "12px"
  sweep: "96px"
spacing: [4, 8, 12, 16, 20, 24, 32, 48]
---

# Kotta — Jardim (web)

A web segue o **mesmo design system do app mobile** (`mobile-kottagroups/DESIGN.md`, decisão de 2026-10-07). Se os dois divergirem, o do mobile vale e este arquivo deve ser atualizado.

Tokens em `app/globals.css` (classes `kotta-*` do Tailwind) e `lib/theme.ts`.

## Cores

| Token | Valor | Uso |
|---|---|---|
| `kotta-primary` | `#2F6B4F` garden green | campo herói, ações primárias, item ativo, "recebe" |
| `kotta-primary-deep` | `#234F3B` | hover/pressed de tudo que é verde |
| `kotta-light-green` | `#DCEADF` leaf field | botões tonais, item selecionado, chip "recebe" |
| `kotta-on-field-muted` | `#CFE3D5` | rótulos sobre o campo verde |
| `kotta-on-field-owes` | `#FFD9CC` | "deve" sobre o campo verde |
| `kotta-bg` | `#F1F4EE` leaf mist | fundo das telas |
| `kotta-surface` | `#FFFFFF` | folhas brancas, inputs |
| `kotta-text` | `#18211C` ink | texto principal, títulos |
| `kotta-muted` | `#56665C` | texto secundário, rótulos |
| `kotta-border` | `#DCE3DC` leaf line | divisórias, trilhos |
| `kotta-border-strong` | `#BFCBC1` | bordas de input, barra do mês passado |
| `kotta-danger` | `#A4492A` terracotta | **só** "deve", ações destrutivas e erros |
| `kotta-danger-bg` | `#F6E6DE` sand rose | chip "deve", fundo de erro |

## Tipografia

- Fonte da plataforma (SF Pro no Apple, Segoe/Roboto nos demais). Não carregar fontes de UI.
- DM Mono só para chave Pix e códigos.
- Valores em reais sempre com `components/app/price.tsx`: reais grandes e leves (300 a partir de 20px), R$ e centavos com metade do tamanho, números tabulares.
- Títulos 700; título de linha 600 16px; rótulo 600 13px em frase. **Sem rótulos em caixa alta.**

## Formas e layout

- Cartões e folhas com raio 16, controles 12, avatares redondos.
- `components/app/garden-field.tsx`: o campo verde do herói, com canto inferior direito em curva de 96. **Um por tela.**
- Listas: folha branca com linhas de 68px e divisórias leaf line.
- Plano: sem sombras em cartões.
- Botão primário verde com 52px de altura; botão tonal leaf field.

## Painel (`/painel`)

Igual à dashboard do app (`src/screens/Dashboard`), nesta ordem:

1. Frase de apoio.
2. Campo verde: "Seu saldo · a receber/a pagar", "Você recebe" e "Você deve".
3. Folha "Gastos dos grupos": barras do mês passado e deste mês.
4. "Últimas quitações": até 3 que envolvem você, com Pago ou Pendente.
5. "Seus grupos · N": emoji, "N pessoas" e chip de saldo.
