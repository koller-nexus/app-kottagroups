import { expect, test as base } from "@playwright/test";

export { expect };
export type { BrowserContext, Page, Request } from "@playwright/test";

export type CspViolation = { directive: string; blockedURI: string; sourceFile: string };

declare global {
  interface Window {
    __reportCspViolation?: (violation: CspViolation) => void;
  }
}

// Toda a suíte vira teste de "nenhuma violação de CSP" (specs/024-csp-nonce, FR-014c). O evento
// dispara em bloqueio e em relato; o script de início sobrevive a navegações.
export const test = base.extend<{ cspViolations: CspViolation[] }>({
  cspViolations: [
    async ({ context }, use) => {
      const violations: CspViolation[] = [];
      await context.exposeBinding("__reportCspViolation", (_source, violation: CspViolation) => {
        violations.push(violation);
      });
      await context.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (event) => {
          window.__reportCspViolation?.({
            directive: event.effectiveDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
          });
        });
      });
      await use(violations);
      expect(violations, "violações de CSP").toEqual([]);
    },
    { auto: true },
  ],
});
