import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets the suite run next to a dev server already on 3002.
const PORT = Number(process.env.E2E_PORT ?? 3002);
const BASE_URL = `http://localhost:${PORT}`;
export const AUTH_FILE = "e2e/.auth/user.json";

const isCI = Boolean(process.env.CI);

// Required: without it the app falls back to the production API.
const API_ORIGIN = process.env.API_ORIGIN;
if (!API_ORIGIN) throw new Error("Missing env var API_ORIGIN (e.g. http://localhost:8085)");

export default defineConfig({
  testDir: "e2e",
  forbidOnly: isCI,
  retries: 0,
  // One worker: every test shares the seed user, so ordering stays predictable.
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // Production build, as the Next testing guide advises. It also runs beside `pnpm dev`,
    // which refuses a second dev server in the same folder.
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: BASE_URL,
    // Never reuse an unknown server: it may point at the production API.
    reuseExistingServer: false,
    timeout: 300_000,
    env: { API_ORIGIN },
  },
});
