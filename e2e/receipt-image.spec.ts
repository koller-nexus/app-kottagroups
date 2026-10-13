import path from "node:path";
import { expect, test, type Page, type Request } from "@playwright/test";
import { runId } from "./run-id";

const FIXTURES = path.join(__dirname, "..", "tests", "fixtures", "receipts");

async function openNewList(page: Page, name: string) {
  await page.goto("/grupos");
  await page.getByRole("main").getByRole("listitem").getByRole("link").first().click();
  await page.getByLabel("Nova lista").fill(`E2E ${name} ${runId}`);
  await page.getByRole("button", { name: "Criar lista" }).click();
  await expect(page).toHaveURL(/\/listas\//);
}

const isServerAction = (request: Request) => request.method() === "POST" && Boolean(request.headers()["next-action"]);

/**
 * Segura a próxima server action até `release()`: quando a nota sobe, a página recarrega e o
 * formulário some, levando junto o status que o teste quer conferir.
 */
async function holdNextServerAction(page: Page) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  let capture!: (request: Request) => void;
  const request = new Promise<Request>((resolve) => (capture = resolve));
  let held = false;
  await page.route("**/*", async (route) => {
    if (held || !isServerAction(route.request())) return route.fallback();
    held = true;
    capture(route.request());
    await released;
    await route.continue();
  });
  return { request, release };
}

// O Chromium não expõe o corpo de requisições com arquivo: no upload ele vem vazio.
const body = (request: Request) => request.postDataBuffer()?.toString("latin1") ?? "";

for (const fixture of ["qr-nitido.jpg", "qr-pequeno-rotacionado.jpg"]) {
  test(`imagem com QR de NFC-e vai só como qrUrl (${fixture})`, async ({ page }) => {
    await openNewList(page, fixture);
    const action = await holdNextServerAction(page);
    await page.getByLabel("Enviar imagem da nota").setInputFiles(path.join(FIXTURES, fixture));

    const request = await action.request;
    await expect(page.getByText("QR code encontrado, enviando…")).toBeVisible();
    expect(body(request)).toContain("qrUrl");
    expect(body(request)).not.toContain("filename=");
    action.release();
  });
}

test("imagem sem QR segue pro OCR com aviso", async ({ page }) => {
  await openNewList(page, "sem-qr");
  const action = await holdNextServerAction(page);
  await page.getByLabel("Enviar imagem da nota").setInputFiles(path.join(FIXTURES, "sem-qr.jpg"));

  const request = await action.request;
  await expect(page.getByText("Não achei o QR code, vou ler a nota pela imagem.")).toBeVisible();
  expect(body(request)).not.toContain("qrUrl");
  action.release();
});

test("QR que não é de nota pede confirmação antes do OCR", async ({ page }) => {
  await openNewList(page, "qr-nao-nfce");
  let actions = 0;
  page.on("request", (request) => {
    if (isServerAction(request)) actions += 1;
  });
  await page.getByLabel("Enviar imagem da nota").setInputFiles(path.join(FIXTURES, "qr-nao-nfce.jpg"));

  await expect(page.getByText("Esse QR não parece de nota fiscal.")).toBeVisible();
  expect(actions).toBe(0);

  const action = await holdNextServerAction(page);
  await page.getByRole("button", { name: "Enviar pro OCR mesmo assim" }).click();
  expect(body(await action.request)).not.toContain("qrUrl");
  action.release();
});
