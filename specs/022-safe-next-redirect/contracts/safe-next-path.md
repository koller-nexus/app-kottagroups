# Contract: `safeNextPath(value, fallback = "/")`

`lib/safe-next.ts`. Assinatura sem mudança; muda só a regra.

## Entrada

- `value: unknown`: o destino cru.
- `fallback: string`: o destino padrão do ponto de uso. Quem chama garante que é interno.

## Saída

Sempre um caminho do próprio app:

- `fallback` quando `value`:
  - não é texto;
  - não começa com `/`;
  - tem caractere 0x00–0x1F, 0x7F ou `\` em qualquer posição;
  - resolvido contra `http://n.invalid`, tem outra origem;
  - normalizado, começa com `//`.
- Senão, `pathname + search + hash` do valor resolvido (forma normalizada e codificada).

Propriedade: `safeNextPath(safeNextPath(x)) === safeNextPath(x)`.

## Tabela de aceite (vira `lib/safe-next.test.mjs`)

| Entrada | Saída | Requisito |
|---------|-------|-----------|
| `/grupos/abc` | `/grupos/abc` | US3 |
| `/convites/x?origem=link#aceitar` | `/convites/x?origem=link#aceitar` | FR-004 |
| `/grupos/../perfil` | `/perfil` | Edge case |
| `/\t/x`, `/\n/x`, `/\r/x` | `/` | FR-002 |
| `/\t\x` | `/` | FR-002 |
| `/.//x`, `/..//x`, `/%2e//x` | `/` | FR-003 |
| `https://evil.example`, `//evil.example`, `/\evil.example` | `/` | FR-001 |
| `null`, `""` | `/` | Edge case |
| `/\t/x` com fallback `/grupos/g/notas/n` | `/grupos/g/notas/n` | FR-005 |
