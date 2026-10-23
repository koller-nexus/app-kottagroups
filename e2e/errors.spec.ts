import { expect, test, type BrowserContext } from "./fixtures";
import { signIn } from "./sign-in";

const SESSION_COOKIE = "__Host-kotta_session";
const LEGACY_SESSION_COOKIE = "kotta_session";
const isSessionCookie = (cookie: { name: string }) =>
  cookie.name === SESSION_COOKIE || cookie.name === LEGACY_SESSION_COOKIE;
const NO_SESSION = { cookies: [], origins: [] };

/** JWT com `exp` no passado. A assinatura não importa: o proxy só lê o payload. */
function expiredToken(): string {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "HS256", typ: "JWT" })}.${part({ exp: Math.floor(Date.now() / 1000) - 60 })}.x`;
}

async function useExpiredSession(context: BrowserContext) {
  // `domain`/`path` em vez de `url`: com `url` o Playwright põe secure=false em http, e o
  // Chromium recusa um cookie `__Host-` sem Secure.
  await context.addCookies([
    { name: SESSION_COOKIE, value: expiredToken(), domain: "localhost", path: "/", secure: true },
  ]);
}

test.describe("sessão vencida", () => {
  test.use({ storageState: NO_SESSION });

  test("cookie vencido leva para /entrar com aviso e apaga o cookie", async ({ page, context }) => {
    await useExpiredSession(context);
    await page.goto("/grupos");

    await expect(page).toHaveURL(/\/entrar\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("motivo")).toBe("expirada");
    expect(url.searchParams.get("next")).toBe("/grupos");
    await expect(page.getByText("Sua sessão expirou. Entre de novo para continuar.")).toBeVisible();
    expect((await context.cookies()).some(isSessionCookie)).toBe(false);
  });

  test("cookie antigo vencido leva para /entrar com aviso e apaga o cookie", async ({ page, context }) => {
    await context.addCookies([{ name: LEGACY_SESSION_COOKIE, value: expiredToken(), domain: "localhost", path: "/" }]);
    await page.goto("/grupos");

    await expect(page).toHaveURL(/\/entrar\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("motivo")).toBe("expirada");
    expect(url.searchParams.get("next")).toBe("/grupos");
    await expect(page.getByText("Sua sessão expirou. Entre de novo para continuar.")).toBeVisible();
    expect((await context.cookies()).some(isSessionCookie)).toBe(false);
  });

  test("cookie vencido em /entrar não volta para /", async ({ page, context }) => {
    await useExpiredSession(context);
    await page.goto("/entrar");

    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});

test.describe("página não encontrada", () => {
  test.describe("sem sessão", () => {
    test.use({ storageState: NO_SESSION });

    test("rota inexistente mostra 404 pública", async ({ page }) => {
      await page.goto("/qualquer-coisa");

      await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Ir para o início" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();
      await expect(page).toHaveTitle(/Página não encontrada — Kotta Groups/);
      await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
      await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).not.toBeAttached();
    });
  });

  test("grupo inexistente mostra 404 dentro do app", async ({ page }) => {
    await page.goto("/grupos/00000000-0000-0000-0000-000000000000");

    await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
    await expect(page.getByText("Esse item não existe ou você não tem acesso a ele.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir para o Painel" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeAttached();
  });
});

// Logout revokes the session in the API: sign in here instead of spending the shared session.
test.describe("sair em várias abas", () => {
  test.use({ storageState: NO_SESSION });

  test("sair numa aba desloga a outra", async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await signIn(pageA);
    await pageA.goto("/grupos");
    await pageB.goto("/perfil");

    await pageA.getByRole("button", { name: "Sair" }).click();

    await expect(pageB).toHaveURL(/\/entrar\?motivo=saiu/, { timeout: 5_000 });
  });
});
