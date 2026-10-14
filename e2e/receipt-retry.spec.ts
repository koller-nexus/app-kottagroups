import { expect, test, type Page } from "@playwright/test";
import { MOCK_API_PORT } from "./mock-api-port";
import { runId } from "./run-id";

const MOCK_ORIGIN = `http://localhost:${MOCK_API_PORT}`;
const ESTABLISHMENT = `Mercado E2E ${runId}`;

type Status = "failed" | "queued" | "done" | "needs_review";

/** Nota como a API devolve; items, matches e total só vêm no resultado final. */
function receipt(status: Status, extra: Record<string, unknown> = {}) {
  const final = status === "done";
  return {
    invoiceId: "mock-invoice",
    status,
    extractionMethod: "ocr",
    file: null,
    uploadedAt: new Date().toISOString(),
    establishment: final ? { cnpj: null, name: ESTABLISHMENT, uf: null } : null,
    issuedOn: null,
    totalCents: final ? 1234 : 0,
    items: [],
    matches: [],
    errorMessage: status === "failed" ? "Receipt extraction failed." : null,
    resolutionPath: null,
    retry: { allowed: false, remaining: 0 },
    ...extra,
  };
}

const retryAllowed = (remaining: number) => ({ retry: { allowed: true, remaining } });

async function openNewList(page: Page, name: string, item?: string): Promise<string> {
  await page.goto("/grupos");
  await page.getByRole("main").getByRole("listitem").getByRole("link").first().click();
  await page.getByLabel("Nova lista").fill(`E2E ${name} ${runId}`);
  await page.getByRole("button", { name: "Criar lista" }).click();
  await expect(page).toHaveURL(/\/listas\//);
  if (item) {
    await page.getByLabel("Item", { exact: true }).fill(item);
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await page.getByRole("checkbox", { name: `${item}, pendente` }).click();
    await expect(page.getByRole("checkbox", { name: `${item}, comprado` })).toBeChecked();
  }
  return new URL(page.url()).pathname.split("/").pop()!;
}

async function mockReceipt(page: Page, listId: string, scenario: Record<string, unknown>) {
  const response = await fetch(`${MOCK_ORIGIN}/__mock/receipt/${listId}`, {
    method: "PUT",
    body: JSON.stringify(scenario),
  });
  expect(response.ok).toBe(true);
  await page.reload();
}

const retryButton = (page: Page) => page.getByRole("button", { name: "Tentar de novo" });

test("nota que falhou: tentar de novo leva a fila, depois ao resultado com selo", async ({ page }) => {
  const listId = await openNewList(page, "retry");
  await mockReceipt(page, listId, {
    receipts: [
      receipt("failed", retryAllowed(2)),
      receipt("queued"),
      receipt("done", { resolutionPath: "qr_image" }),
    ],
  });

  await expect(page.getByText("2 tentativas restantes")).toBeVisible();
  await retryButton(page).click();

  await expect(page.getByText("Lendo sua nota…")).toBeVisible();
  await expect(retryButton(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: ESTABLISHMENT })).toHaveCount(0);

  await expect(page.getByRole("heading", { name: ESTABLISHMENT })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Lido pelo QR code")).toBeVisible();
  await expect(retryButton(page)).toHaveCount(0);
});

for (const [code, message] of [
  ["RECEIPT_RETRY_NOT_ALLOWED", "Essa nota não pode ser lida de novo agora."],
  ["RECEIPT_NOT_RETRYABLE", "Essa nota já foi importada neste grupo."],
  ["RECEIPT_RETRY_LIMIT", "Você já usou todas as tentativas para esta nota."],
] as const) {
  test(`retry recusado (${code}) mostra a mensagem e libera o botão`, async ({ page }) => {
    const listId = await openNewList(page, code);
    await mockReceipt(page, listId, {
      receipts: [receipt("failed", retryAllowed(1))],
      retryError: { status: 409, code },
    });

    await expect(page.getByText("1 tentativa restante")).toBeVisible();
    await retryButton(page).click();

    await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
    await expect(retryButton(page)).toBeEnabled();
    await expect(page.getByText("Retry refused.")).toHaveCount(0);
  });
}

test("falha sem nova tentativa explica e oferece foto ou QR", async ({ page }) => {
  const listId = await openNewList(page, "sem-retry");
  await mockReceipt(page, listId, { receipts: [receipt("failed")] });

  await expect(page.getByText("Essa nota não pode ser lida de novo.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Escanear QR code" })).toBeVisible();
  await expect(page.getByLabel("Enviar imagem da nota")).toBeAttached();
  await expect(retryButton(page)).toHaveCount(0);
  await expect(page.getByText("Receipt extraction failed.")).toHaveCount(0);
});

test("na fila: só o status, itens marcados continuam e não há botão", async ({ page }) => {
  const item = `E2E item ${runId}`;
  const listId = await openNewList(page, "fila", item);
  await mockReceipt(page, listId, {
    receipts: [receipt("queued", retryAllowed(2))],
    completeItems: true,
  });

  await expect(page.getByText("Lendo sua nota…")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: `${item}, comprado` })).toBeChecked();
  await expect(page.getByRole("heading", { name: ESTABLISHMENT })).toHaveCount(0);
  await expect(retryButton(page)).toHaveCount(0);
});

test("nota pronta sem origem não mostra selo nem botão", async ({ page }) => {
  const listId = await openNewList(page, "sem-origem");
  await mockReceipt(page, listId, { receipts: [receipt("done", retryAllowed(2))] });

  await expect(page.getByRole("heading", { name: ESTABLISHMENT })).toBeVisible();
  for (const badge of ["Lido pelo QR code", "Lido pela chave de acesso", "Lido da foto — confira os itens"]) {
    await expect(page.getByText(badge)).toHaveCount(0);
  }
  await expect(retryButton(page)).toHaveCount(0);
});
