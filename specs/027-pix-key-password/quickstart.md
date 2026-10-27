# Quickstart: validar a senha na troca da chave Pix

## Pré-requisitos

- A API com a spec 094 (api#254, `VERSION` 0.18.0 ou maior) rodando localmente ou no ambiente de
  teste.
- Um usuário confirmado com senha conhecida (`E2E_EMAIL` / `E2E_PASSWORD` para o e2e).
- `pnpm install` feito.

## Testes automáticos

```bash
pnpm test                 # inclui lib/profile-update.test.mjs (tabelas do data-model.md)
pnpm lint
API_ORIGIN=http://localhost:8085 pnpm test:e2e e2e/profile.spec.ts
pnpm build
```

Esperado: tudo passa. O e2e faz uma única checagem de senha real por execução (research R6).

## Roteiro manual (`pnpm dev`, logado, em `/perfil`)

1. **Só o nome**: mude o nome e salve.
   - Nenhum campo de senha aparece.
   - "Alterações salvas." aparece e o nome novo surge no shell.
2. **Campo aparece e some**:
   - Digite outra chave: "Senha atual" aparece.
   - Volte a chave ao valor salvo: o campo some.
3. **Sem senha**: troque a chave, deixe a senha vazia e salve.
   - "Digite sua senha atual para trocar a chave Pix." aparece no campo, com o foco nele.
   - Nome e chave continuam digitados.
4. **Senha errada**: repita com uma senha errada.
   - "Senha incorreta." aparece no campo e o campo de senha volta vazio.
   - Você continua em `/perfil`, logado.
5. **Senha certa**: repita com a senha certa.
   - "Alterações salvas." aparece, o resumo mostra a chave nova e o campo de senha some.
   - O dono da conta recebe o e-mail de aviso, enviado pela API.
6. **Apagar a chave**: apague a chave e salve com a senha certa.
   - O resumo mostra "Nenhuma chave Pix cadastrada".
7. **Excesso de tentativas**: erre a senha 6 vezes seguidas.
   - A mensagem de muitas tentativas aparece no campo, com o tempo de espera.
8. **Sem JavaScript** (DevTools → desativar JS): troque a chave e salve.
   - A página volta com o campo de senha visível e o erro de senha obrigatória.
9. **Senha não vaza**: no passo 4, confira na aba Network que a resposta da Server Action não
   contém a senha digitada.
