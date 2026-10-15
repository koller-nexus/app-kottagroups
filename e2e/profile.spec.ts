import { expect, test, type Page } from "@playwright/test";
import { MOCK_API_PORT } from "./mock-api-port";
import { runId } from "./run-id";

const MOCK_ORIGIN = `http://localhost:${MOCK_API_PORT}`;

/** Faz o proxy responder `status` em GET neste path da API. */
async function failApi(path: string, status = 503) {
  const response = await fetch(`${MOCK_ORIGIN}/__mock/fail`, {
    method: "PUT",
    body: JSON.stringify({ path, status }),
  });
  expect(response.ok).toBe(true);
}

async function clearApiFailures() {
  await fetch(`${MOCK_ORIGIN}/__mock/fail`, { method: "DELETE" });
}

test.afterEach(clearApiFailures);

async function expectAccountVisible(page: Page) {
  const summary = page.getByRole("region", { name: "Resumo da conta" });
  await expect(summary.getByText(process.env.E2E_EMAIL ?? "", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Seus dados" })).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sair da conta" })).toBeVisible();
}

test("/perfil mostra os dados do usuário", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
  await expectAccountVisible(page);
  const summary = page.getByRole("region", { name: "Resumo da conta" });
  await expect(summary.getByText(/^Membro desde \S+ de \d{4}$/)).toBeVisible();
  await expect(summary.getByText(/^(Chave Pix: .+|Nenhuma chave Pix cadastrada)$/)).toBeVisible();
  await expect(summary.getByText(/^E-mail (não )?confirmado$/)).toBeVisible();

  await page.setViewportSize({ width: 375, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

// PNG 1×1 válido.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test("trocar foto envia a imagem e mostra a foto nova no resumo", async ({ page }) => {
  await page.goto("/perfil");
  const picker = page.getByLabel("Alterar foto de perfil");
  await expect(picker).toBeEnabled(); // habilita depois da hidratação
  await picker.setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: PNG });

  await expect(page.getByText("Foto atualizada.")).toBeVisible({ timeout: 10_000 });
  const photo = page.getByRole("region", { name: "Resumo da conta" }).locator("img");
  await expect(photo).toHaveAttribute("src", /avatar/);
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test("trocar foto recusa arquivo que não é JPG, PNG ou WebP sem enviar", async ({ page }) => {
  const uploads: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/perfil")) uploads.push(request.url());
  });
  await page.goto("/perfil");

  const picker = page.getByLabel("Alterar foto de perfil");
  await expect(picker).toBeEnabled();
  await picker.setInputFiles({
    name: "foto.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("GIF89a"),
  });
  await expect(page.getByText("Use uma foto JPG, PNG ou WebP de até 5 MB")).toBeVisible();
  expect(uploads).toEqual([]);
});

test("/perfil abre com as categorias fora do ar e recupera ao tentar de novo", async ({ page }) => {
  await failApi("/api/v1/categories");
  await page.goto("/perfil");

  await expectAccountVisible(page);
  const categories = page.getByRole("region", { name: "Categorias" });
  await expect(categories.getByText("Não foi possível carregar suas categorias.")).toBeVisible();
  await expect(categories.getByRole("link", { name: "Gerenciar categorias" })).toBeVisible();

  await clearApiFailures();
  await categories.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(categories.getByRole("listitem").first()).toBeVisible();
  await expect(categories.getByText("Não foi possível carregar suas categorias.")).toBeHidden();
});

test("/perfil abre com os grupos fora do ar, sem o contador", async ({ page }) => {
  await failApi("/api/v1/groups");
  await page.goto("/perfil");

  await expectAccountVisible(page);
  const summary = page.getByRole("region", { name: "Resumo da conta" });
  await expect(summary.getByText("Não foi possível carregar seus grupos.")).toBeVisible();
  await expect(summary.getByText(/^\d+ grupos?$/)).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Categorias" }).getByRole("listitem").first()).toBeVisible();
});

test("sem os dados da conta, a tela de erro diz que o serviço não respondeu", async ({ page }) => {
  await failApi("/api/v1/users/me");
  await page.goto("/perfil");

  // Build de produção: o tipo do erro só chega ao navegador pelo digest do ApiError.
  await expect(page.getByRole("heading", { name: "O Kotta Groups não respondeu" })).toBeVisible();
  await clearApiFailures();
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(page.getByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
});

test("criar categoria", async ({ page }) => {
  const name = `E2E categoria ${runId}`;

  await page.goto("/perfil/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Salvar categoria" }).click();

  await expect(page).toHaveURL(/\/perfil\/categorias$/);
  await expect(page.getByText(name)).toBeVisible();
});
