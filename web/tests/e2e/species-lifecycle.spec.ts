import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Species lifecycle through the browser: an officer creates a species via the
// form, sees it in the catalogue, opens its detail page, and the record is
// deleted afterwards over REST so the live project keeps zero residue.

const envFile = readFileSync(path.resolve(__dirname, "../../.env.local"), "utf8");
const envValue = (key: string) => envFile.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim() ?? "";

const SUPABASE_URL = envValue("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const TEST_PASSWORD = envValue("E2E_TEST_PASSWORD");

async function token(email: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.json() as Promise<{ access_token: string }>;
}

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/signin");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL(/\/(records|species|profile)/, { timeout: 15_000 });
}

async function deleteSpecies(id: string) {
  const off = await token("dld@officer.com");
  await fetch(`${SUPABASE_URL}/rest/v1/species?species_id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${off.access_token}` },
  });
}

test("officer creates a species through the form and finds it in the catalogue", async ({ page }) => {
  test.setTimeout(60_000);
  const name = "Testus e2elifera";
  let createdId: string | null = null;
  try {
    await signIn(page, "dld@officer.com");
    await page.goto("/species/new");
    await expect(page.getByRole("heading", { name: "New species" })).toBeVisible();

    await page.fill('input[placeholder*="Nepenthes lowii"]', name);
    await page.fill('input[placeholder*="Low\'s pitcher plant"]', "E2E showy");
    await page.fill('textarea', "Created by the browser suite; safe to delete.");
    await page.click('button:has-text("Create species")');

    // Resolve the new row over REST first so cleanup always has its id, even
    // if a later UI assertion fails; dev-mode route compilation is slow.
    const off = await token("dld@officer.com");
    let rows: { species_id: string }[] = [];
    await expect(async () => {
      rows = await (await fetch(
        `${SUPABASE_URL}/rest/v1/species?scientific_name=eq.${encodeURIComponent(name)}&select=species_id`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${off.access_token}` } }
      )).json() as { species_id: string }[];
      expect(rows.length).toBe(1);
    }).toPass({ timeout: 20_000 });
    createdId = rows[0].species_id;

    // The form redirects to the catalogue, which now lists the new species.
    await expect(page).toHaveURL(/\/species(\?|$)/, { timeout: 20_000 });
    await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 20_000 });

    // The officer catalogue links to the detail page.
    await page.click(`text=${name}`);
    await expect(page.getByText(/E2E showy|Created by the browser suite/).first()).toBeVisible({ timeout: 15_000 });
  } finally {
    if (createdId) await deleteSpecies(createdId);
  }
});

test("non-officer cannot reach the new species page", async ({ page }) => {
  await signIn(page, "dld@botanist.com");
  await page.goto("/species/new");
  // The page redirects officers-only visitors away from the form.
  await expect(page).not.toHaveURL(/\/species\/new/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "New species" })).toHaveCount(0);
});
