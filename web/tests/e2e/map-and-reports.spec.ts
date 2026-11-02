import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Visitor map click-through and the reports page gate. Read-only by design:
// the map renders approved points and client-side filter chips, and the
// reports page is inspected without submitting the generate form. Report
// *generation* uploads a file to the private reports bucket, which has no
// storage delete policy, so a submitted test file could never be cleaned up
// from the client side; that round trip is deliberately not automated here.

const envFile = readFileSync(path.resolve(__dirname, "../../.env.local"), "utf8");
const envValue = (key: string) => envFile.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim() ?? "";

const TEST_PASSWORD = envValue("E2E_TEST_PASSWORD");

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/signin");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL(/\/(records|species|profile)/, { timeout: 15_000 });
}

test("visitor map loads and filter chips toggle client-side", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/map");
  await expect(page.getByRole("heading", { name: /Species map/ })).toBeVisible({ timeout: 20_000 });

  const chips = page.getByRole("group", { name: "Filter observations by approval status" });
  const emptyState = page.getByText("No observations with GPS coordinates yet");
  // Either the map with chips or the honest empty state; both are correct.
  await expect(chips.or(emptyState).first()).toBeVisible({ timeout: 20_000 });

  if (await chips.isVisible()) {
    // MapLibre initialises WebGL; give the canvas a moment, then toggle.
    const approved = chips.getByRole("button", { name: /Approved/ });
    await expect(approved).toBeVisible();
    await approved.click();
    await expect(approved).toHaveAttribute("aria-pressed", "true");
    const all = chips.getByRole("button", { name: /^All/ });
    await all.click();
    await expect(all).toHaveAttribute("aria-pressed", "true");
  }
});

test("officer reaches the reports page and sees the generate form", async ({ page }) => {
  test.setTimeout(60_000);
  await signIn(page, "dld@officer.com");
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Generate report" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Generated reports" })).toBeVisible();
});

test("botanist is redirected away from the reports page", async ({ page }) => {
  await signIn(page, "dld@botanist.com");
  await page.goto("/reports");
  await expect(page).not.toHaveURL(/\/reports/, { timeout: 15_000 });
});
