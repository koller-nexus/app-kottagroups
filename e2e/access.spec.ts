import { expect, test } from "@playwright/test";
import { runId } from "./run-id";
import { signIn } from "./sign-in";

// Successful sign-in is covered by auth.setup.ts.
test.describe("sem sessão", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("senha inválida mostra erro e continua em /entrar", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(process.env.E2E_EMAIL ?? "");
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("cadastrar leva para confirme seu e-mail", async ({ page }) => {
    await page.goto("/cadastrar");
    await page.getByLabel("Nome").fill(`E2E ${runId}`);
    await page.getByLabel("E-mail").fill(`e2e+${runId}@example.com`);
    await page.getByLabel("Senha", { exact: true }).fill("senha-e2e-123");
    await page.getByRole("checkbox", { name: /Li e aceito/ }).check();
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("heading", { name: "Confirme seu e-mail" })).toBeVisible();
  });

  test("cadastrar sem aceitar os termos não envia e mostra o erro no campo", async ({ page }) => {
    await page.goto("/cadastrar");
    await page.getByLabel("Nome").fill(`E2E ${runId}`);
    await page.getByLabel("E-mail").fill(`e2e-sem-aceite+${runId}@example.com`);
    await page.getByLabel("Senha", { exact: true }).fill("senha-e2e-123");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Li e aceito/ })).toBeFocused();
    await expect(page).toHaveURL(/\/cadastrar/);
  });

  test("esqueci a senha mostra a confirmação de envio", async ({ page }) => {
    await page.goto("/esqueci-a-senha");
    await page.getByLabel("E-mail").fill(process.env.E2E_EMAIL ?? "");
    await page.getByRole("button", { name: "Enviar e-mail" }).click();

    await expect(page.getByText(/enviamos as instruções para redefinir a senha/)).toBeVisible();
  });

  test("rota protegida leva para /entrar", async ({ page }) => {
    await page.goto("/grupos");
    await expect(page).toHaveURL(/\/entrar\?next=%2Fgrupos/);
  });
});

// Logout revokes the session in the API, so these tests sign in on their own instead of
// spending the shared session the other tests depend on.
test.describe("sair", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sair encerra a sessão", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar\?motivo=saiu/);

    await page.goto("/grupos");
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("sair revoga a sessão na API", async ({ page }) => {
    await signIn(page);
    const token = (await page.context().cookies()).find((cookie) => cookie.name === "kotta_session")?.value;
    expect(token).toBeTruthy();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar\?motivo=saiu/);

    const response = await fetch(`${process.env.API_ORIGIN}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(401);
  });
});
