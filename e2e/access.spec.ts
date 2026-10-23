import { expect, test } from "./fixtures";
import { runId } from "./run-id";
import { signIn } from "./sign-in";

const SESSION_COOKIE = "__Host-kotta_session";
const LEGACY_SESSION_COOKIE = "kotta_session";
const isSessionCookie = (cookie: { name: string }) =>
  cookie.name === SESSION_COOKIE || cookie.name === LEGACY_SESSION_COOKIE;

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
    const token = (await page.context().cookies()).find((cookie) => cookie.name === SESSION_COOKIE)?.value;
    expect(token).toBeTruthy();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar\?motivo=saiu/);

    const response = await fetch(`${process.env.API_ORIGIN}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(401);
  });

  test("entrar grava só o cookie novo, preso ao host", async ({ page }) => {
    await signIn(page);
    const cookies = await page.context().cookies();

    const session = cookies.find((cookie) => cookie.name === SESSION_COOKIE);
    expect(session).toMatchObject({ secure: true, httpOnly: true, sameSite: "Lax", path: "/", domain: "localhost" });
    expect(session?.expires).toBeGreaterThan(Date.now() / 1000);
    expect(cookies.some((cookie) => cookie.name === LEGACY_SESSION_COOKIE)).toBe(false);
  });

  test("sair com os dois cookies não deixa nenhum", async ({ page, context }) => {
    await signIn(page);
    await context.addCookies([{ name: LEGACY_SESSION_COOKIE, value: "antigo", domain: "localhost", path: "/" }]);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar\?motivo=saiu/);
    expect((await context.cookies()).some(isSessionCookie)).toBe(false);

    await page.goto("/grupos");
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("sessão recusada pela API em /sair apaga os dois cookies", async ({ page, context }) => {
    await signIn(page);
    const value = (await context.cookies()).find((cookie) => cookie.name === SESSION_COOKIE)?.value ?? "";
    const revoked = await fetch(`${process.env.API_ORIGIN}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${value}` },
    });
    expect(revoked.ok).toBe(true);
    await context.addCookies([{ name: LEGACY_SESSION_COOKIE, value, domain: "localhost", path: "/" }]);

    await page.goto("/sair?motivo=expirada");
    await expect(page).toHaveURL(/\/entrar/);
    expect((await context.cookies()).some(isSessionCookie)).toBe(false);
  });
});

// Quem entrou antes do cookie `__Host-` (#84) tem só o nome antigo e não pode ser deslogado.
test.describe("cookie antigo", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("cookie antigo válido continua logado e vira o novo", async ({ page, context }) => {
    await signIn(page);
    const session = (await context.cookies()).find((cookie) => cookie.name === SESSION_COOKIE);
    expect(session).toBeTruthy();
    const { value, expires } = session!;
    await context.clearCookies();
    await context.addCookies([
      { name: LEGACY_SESSION_COOKIE, value, expires, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
    ]);

    await page.goto("/grupos");
    await expect(page).toHaveURL(/\/grupos$/);

    const cookies = await context.cookies();
    const migrated = cookies.find((cookie) => cookie.name === SESSION_COOKIE);
    expect(migrated?.value).toBe(value);
    expect(Math.abs((migrated?.expires ?? 0) - expires)).toBeLessThanOrEqual(1);
    expect(cookies.some((cookie) => cookie.name === LEGACY_SESSION_COOKIE)).toBe(false);
  });
});
