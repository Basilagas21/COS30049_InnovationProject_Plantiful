import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Full report round trip through the browser: officer generates a CSV,
// downloads it and the bytes parse as the expected table, then the report
// row and its storage object are deleted via the API using the officer's
// own token. The object delete is the exact capability the new
// officer_delete_reports storage policy grants, so this test doubles as the
// live verification that the Dashboard change took effect. Zero residue.

const envFile = readFileSync(path.resolve(__dirname, "../../.env.local"), "utf8");
const envValue = (key: string) => envFile.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim() ?? "";

const SUPABASE_URL = envValue("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const TEST_PASSWORD = envValue("E2E_TEST_PASSWORD");

async function officerHeaders() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email: "dld@officer.com", password: TEST_PASSWORD }),
  });
  if (!res.ok) throw new Error(`officer login failed: ${res.status}`);
  const { access_token } = (await res.json()) as { access_token: string };
  return { apikey: ANON_KEY, Authorization: `Bearer ${access_token}` };
}

test("officer generates, downloads and removes a report end to end", async ({ page }) => {
  test.setTimeout(90_000);
  const H = await officerHeaders();

  const before = await (await fetch(
    `${SUPABASE_URL}/rest/v1/reports?select=report_id`,
    { headers: H },
  )).json() as { report_id: string }[];

  await page.goto("/signin");
  await page.fill('input[type="email"]', "dld@officer.com");
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL(/\/(records|species|profile)/, { timeout: 15_000 });

  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible({ timeout: 20_000 });

  // Keep the default type (observations) and format (CSV), submit.
  await page.click('button:has-text("Generate report")');

  // Wait for the generation to actually land a new row (the list may show
  // older rows whose links are already visible, so poll the API instead of
  // racing the DOM).
  let created: { report_id: string; file_url: string } | undefined;
  await expect(async () => {
    const after = await (await fetch(
      `${SUPABASE_URL}/rest/v1/reports?select=report_id,file_url,created_at&order=created_at.desc&limit=5`,
      { headers: H },
    )).json() as { report_id: string; file_url: string }[];
    created = after.find((r) => !before.some((b) => b.report_id === r.report_id));
    expect(created).toBeTruthy();
  }).toPass({ timeout: 30_000 });

  // The page list refreshes and offers the download for the new row.
  const download = page.locator('a:has-text("Download CSV")').first();
  await expect(download).toBeVisible({ timeout: 20_000 });

  // The signed URL must actually serve CSV bytes.
  const href = await download.getAttribute("href");
  expect(href).toBeTruthy();
  const res = await fetch(href!);
  expect(res.ok).toBeTruthy();
  const text = await res.text();
  expect(text).toContain("record_id");
  expect(text).toContain("qr_code");

  const newRow = created!;
  const delObj = await fetch(
    `${SUPABASE_URL}/storage/v1/object/reports/${newRow.file_url}`,
    { method: "DELETE", headers: H },
  );
  expect(delObj.status).toBe(200); // policy live, officer may delete

  const delRow = await fetch(
    `${SUPABASE_URL}/rest/v1/reports?report_id=eq.${newRow.report_id}`,
    { method: "DELETE", headers: H },
  );
  expect([200, 204]).toContain(delRow.status);

  // Residue check: nothing matching our new id remains.
  const check = await (await fetch(
    `${SUPABASE_URL}/rest/v1/reports?report_id=eq.${newRow.report_id}&select=report_id`,
    { headers: H },
  )).json() as unknown[];
  expect(check.length).toBe(0);
});
