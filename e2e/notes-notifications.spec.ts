import path from "node:path";
import { expect, test } from "@playwright/test";
import { MOCK_API_PORT } from "./mock-api-port";
import { runId } from "./run-id";

const MOCK_ORIGIN = `http://localhost:${MOCK_API_PORT}`;

const RECEIPT = path.join(__dirname, "..", "tests", "fixtures", "receipts", "sem-qr.jpg");

// PNG 1x1 inline: a simulação da nota não precisa servir arquivo.
const PIXEL_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function setInvoice(invoiceId: string, override: Record<string, unknown>) {
  const response = await fetch(`${MOCK_ORIGIN}/__mock/invoice/${invoiceId}`, {
    method: "PUT",
    body: JSON.stringify(override),
  });
  expect(response.ok).toBe(true);
}

test("/notas antigo leva aos grupos e saiu do menu", async ({ page }) => {
  await page.goto("/notas");
  await expect(page).toHaveURL(/\/grupos$/);
  await page.goto("/notas/qualquer-id");
  await expect(page).toHaveURL(/\/grupos$/);
  await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Notas" })).toHaveCount(0);
});

test.describe("notas do grupo", () => {
  test.describe.configure({ mode: "serial" });

  const description = `E2E nota ${runId}`;
  let expensePath = "";
  let notePath = "";

  test("enviar nota a partir da despesa já vincula", async ({ page }) => {
    await page.goto("/despesas/nova");
    await page.getByLabel("Descrição").fill(description);
    await page.getByLabel("Valor (R$)").fill("10,00");
    await page.getByRole("button", { name: "Salvar despesa" }).click();
    await page.getByRole("link", { name: new RegExp(description) }).click();
    await expect(page.getByRole("heading", { name: description, level: 1 })).toBeVisible();
    expensePath = new URL(page.url()).pathname;

    await page.getByLabel("Foto da nota").setInputFiles(RECEIPT);
    await page.getByRole("button", { name: "Enviar nota" }).click();

    await expect(page).toHaveURL(/\/grupos\/[^/]+\/notas\/[^/]+$/);
    notePath = new URL(page.url()).pathname;
    await expect(page.getByRole("link", { name: description })).toBeVisible();
  });

  test("desvincular e vincular de novo pela nota", async ({ page }) => {
    // Sem OCR no CI a nota nunca fica "lida", e a seção Despesa só aparece para nota lida.
    await setInvoice(notePath.split("/").pop()!, { status: "done" });
    await page.goto(notePath);
    await page.getByRole("button", { name: "Desvincular" }).click();
    await expect(page.getByText("Esta nota ainda não comprova nenhuma despesa.")).toBeVisible();

    const select = page.getByLabel("Vincular a uma despesa");
    const value = await select.locator("option", { hasText: description }).getAttribute("value");
    await select.selectOption(value ?? "");
    await page.getByRole("button", { name: "Vincular" }).click();
    await expect(page.getByRole("link", { name: description })).toBeVisible();

    await page.goto(expensePath);
    await expect(page.getByRole("link", { name: "Ver a nota" })).toHaveAttribute("href", notePath);
  });

  test("nota que falhou: explica, oferece outra foto e esconde Despesa", async ({ page }) => {
    const invoiceId = notePath.split("/").pop()!;
    // Sem vínculo: a nota do teste anterior foi vinculada de novo, então a desvinculamos na simulação.
    await setInvoice(invoiceId, { status: "failed", expenseId: null, errorMessage: "Receipt extraction failed." });
    await page.goto(notePath);
    await expect(page.getByRole("alert").filter({ hasText: "Não conseguimos ler esta nota" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Esta nota não pode ser lida de novo. Envie outra foto." })).toBeVisible();
    await expect(page.getByLabel("Foto da nota")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Despesa", level: 2 })).toHaveCount(0);
  });

  test("nota na fila ou processando não mostra Despesa; lida mostra", async ({ page }) => {
    const invoiceId = notePath.split("/").pop()!;
    for (const status of ["queued", "processing"]) {
      await setInvoice(invoiceId, { status, expenseId: null });
      await page.goto(notePath);
      await expect(page.getByRole("heading", { name: "Despesa", level: 2 })).toHaveCount(0);
    }
    await setInvoice(invoiceId, { status: "done", expenseId: null });
    await page.goto(notePath);
    await expect(page.getByRole("heading", { name: "Despesa", level: 2 })).toBeVisible();
    await setInvoice(invoiceId, {});
  });

  test("nota em leitura consulta só o status e atualiza a tela quando termina", async ({ page }) => {
    const invoiceId = notePath.split("/").pop()!;
    await setInvoice(invoiceId, { status: "processing", expenseId: null });
    const statusChecks: string[] = [];
    // router.refresh() é um request RSC sem o cabeçalho de prefetch dos links.
    const refreshes: string[] = [];
    page.on("request", (request) => {
      const headers = request.headers();
      if (request.url().includes("/api/notas/status")) statusChecks.push(request.url());
      else if (headers.rsc && !headers["next-router-prefetch"]) refreshes.push(request.url());
    });

    await page.goto(notePath);
    await expect.poll(() => statusChecks.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(refreshes).toHaveLength(0);

    await setInvoice(invoiceId, { status: "done", expenseId: null });
    await expect(page.getByRole("heading", { name: "Despesa", level: 2 })).toBeVisible({ timeout: 15_000 });
    expect(refreshes).toHaveLength(1);
    await setInvoice(invoiceId, {});
  });

  test("foto enviada fica ao lado da leitura para conferir", async ({ page }) => {
    const invoiceId = notePath.split("/").pop()!;
    const photo = page.getByRole("complementary", { name: "Foto enviada" });
    await setInvoice(invoiceId, {
      status: "done",
      expenseId: null,
      file: { contentType: "image/png", sizeBytes: 68, url: PIXEL_PNG },
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(notePath);
    await expect(photo.getByRole("img", { name: /^Foto enviada: / })).toBeVisible();
    const open = photo.getByRole("link");
    await expect(open).toHaveAttribute("href", PIXEL_PNG);
    await expect(open).toHaveAttribute("target", "_blank");
    await open.focus();
    await expect(open).toBeFocused();

    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

    // TIFF (ou link vencido) não renderiza: aviso no lugar, com o arquivo ainda acessível.
    await setInvoice(invoiceId, { file: { contentType: "image/tiff", sizeBytes: 4, url: "data:image/tiff;base64,AAAA" } });
    await page.goto(notePath);
    await expect(photo.getByText("Não foi possível carregar a foto.")).toBeVisible();
    await expect(photo.getByRole("link", { name: "Abrir foto" })).toBeVisible();

    // Nota pelo QR code: sem coluna.
    await setInvoice(invoiceId, { file: null });
    await page.goto(notePath);
    await expect(photo).toHaveCount(0);
    await setInvoice(invoiceId, {});
  });

  test("resumo mostra valor dos itens, desconto e total; avisa quando não fecha", async ({ page }) => {
    const invoiceId = notePath.split("/").pop()!;
    const line = (description: string, quantity: number, unit: number) => ({
      description,
      quantity,
      unit_amount: unit,
      line_total: Math.round(quantity * unit * 100) / 100,
    });
    const summary = page.locator("dl").first();
    const mismatch = page.getByText("Os itens não fecham com o total");

    // A nota do exemplo: itens R$ 104,15, desconto impresso R$ 4,15, total R$ 100,00.
    await setInvoice(invoiceId, {
      status: "done",
      expenseId: null,
      resolutionPath: "ocr",
      items: [line("COPO PAPEL 110ML PRETO", 6, 14.9), line("MEXEDOR PDRINK CRISTAL", 1, 14.75)],
      itemsTotal: 100,
      estimatedTotal: 100,
    });
    await page.goto(notePath);
    await expect(summary.getByText("Valor dos itens")).toBeVisible();
    await expect(summary.getByRole("img", { name: /^R\$\s104,15$/ })).toBeVisible();
    await expect(summary.getByText("Desconto")).toBeVisible();
    await expect(summary.getByRole("img", { name: /^menos R\$\s4,15$/ })).toBeVisible();
    await expect(summary.getByRole("img", { name: /^R\$\s100,00$/ })).toBeVisible();
    await expect(page.getByText("Soma dos itens")).toHaveCount(0);
    await expect(mismatch).toHaveCount(0);

    // Item faltando na leitura: a conta não fecha e a tela avisa.
    await setInvoice(invoiceId, {
      status: "done",
      expenseId: null,
      resolutionPath: "ocr",
      items: [line("ITEM", 1, 10)],
      itemsTotal: 10,
      estimatedTotal: 15,
    });
    await page.goto(notePath);
    await expect(mismatch).toBeVisible();
    await expect(summary.getByText("Desconto")).toHaveCount(0);
    await setInvoice(invoiceId, {});
  });

  test("a nota aparece nas notas do grupo", async ({ page }) => {
    const groupNotes = notePath.replace(/\/[^/]+$/, "");
    await page.goto(groupNotes);
    await expect(page.getByRole("heading", { name: "Notas", level: 1 })).toBeVisible();
    await expect(page.locator(`a[href="${notePath}"]`)).toBeVisible();
  });
});

test("/notificacoes mostra as pendências ou o estado vazio", async ({ page }) => {
  await page.goto("/notificacoes");
  await expect(page.getByRole("heading", { name: "Notificações", level: 1 })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("list").or(main.getByText("Nenhuma pendência")).first()).toBeVisible();
});
