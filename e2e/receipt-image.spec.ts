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

// Server actions sobem como POST com o header next-action; o corpo mostra o que foi enviado.
function nextServerAction(page: Page): Promise<Request> {
  return page.waitForRequest((request) => request.method() === "POST" && Boolean(request.headers()["next-action"]));
}

const body = (request: Request) => request.postDataBuffer()?.toString("latin1") ?? "";

for (const fixture of ["qr-nitido.jpg", "qr-pequeno-rotacionado.jpg"]) {
  test(`imagem com QR de NFC-e vai só como qrUrl (${fixture})`, async ({ page }) => {
    await openNewList(page, fixture);
    const sent = nextServerAction(page);
    await page.getByLabel("Enviar imagem da nota").setInputFiles(path.join(FIXTURES, fixture));

    await expect(page.getByText("QR code encontrado, enviando…")).toBeVisible();
    const request = await sent;
    expect(body(request)).toContain("qrUrl");
    expect(body(request)).not.toContain("filename=");
  });
}

test("imagem sem QR segue pro OCR com aviso", async ({ page }) => {
  await openNewList(page, "sem-qr");
  const sent = nextServerAction(page);
  await page.getByLabel("Enviar imagem da nota").setInputFiles(path.join(FIXTURES, "sem-qr.jpg"));

  await expect(page.getByText("Não achei o QR code, vou ler a nota pela imagem.")).toBeVisible();
  const request = await sent;
  expect(body(request)).toContain("filename=");
  expect(body(request)).not.toContain("qrUrl");
});

test("QR que não é de nota pede confirmação antes do OCR", async ({ page }) => {
  await openNewList(page, "qr-nao-nfce");
  let actions = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) actions += 1;
  });
  await page.getByLabel("Enviar imagem da nota").setInputFiles(path.join(FIXTURES, "qr-nao-nfce.jpg"));

  await expect(page.getByText("Esse QR não parece de nota fiscal.")).toBeVisible();
  expect(actions).toBe(0);

  const sent = nextServerAction(page);
  await page.getByRole("button", { name: "Enviar pro OCR mesmo assim" }).click();
  expect(body(await sent)).toContain("filename=");
});
