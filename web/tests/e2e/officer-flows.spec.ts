import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

// Officer and visitor flows against the live Supabase project, using
// disposable records that are created over REST before each flow and deleted
// afterwards, so the suite leaves zero residue. The second-client pattern
// matches the #39 verification method.

// Playwright's test process does not load Next's .env.local, so the REST
// helpers read the same file the dev server uses.
const envFile = readFileSync(path.resolve(__dirname, "../../.env.local"), "utf8");
const envValue = (key: string) => envFile.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim() ?? "";

const SUPABASE_URL = envValue("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
// Test-account password lives in the gitignored .env.local, never committed.
const TEST_PASSWORD = envValue("E2E_TEST_PASSWORD");

async function token(email: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.json() as Promise<{ access_token: string; user: { id: string } }>;
}

async function createPendingRecord(name: string) {
  const bot = await token("dld@botanist.com");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/plant_records`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${bot.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      botanist_id: bot.user.id,
      provisional_name: name,
      status: "submitted",
      approval_status: "pending",
      qr_code: `PLT-E2E${createHash("md5").update(name).digest("hex").slice(0, 4).toUpperCase()}`,
    }),
  });
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error(`record create failed: ${JSON.stringify(rows).slice(0, 120)}`);
  return { id: rows[0].record_id as string, bot };
}

async function cleanup(id: string) {
  const adm = await token("dld@admin.com");
  await fetch(`${SUPABASE_URL}/rest/v1/plant_records?record_id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${adm.access_token}` },
  });
}

async function readBack(id: string) {
  const off = await token("dld@officer.com");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/plant_records?record_id=eq.${id}&select=approval_status,rejection_reason,reviewed_by`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${off.access_token}` } }
  );
  const rows = await res.json();
  return rows[0];
}

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/signin");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL(/\/(records|species|profile)/, { timeout: 15_000 });
}

test("visitor explore page lists approved species without sign-in", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: /plant guide|explore/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/sign in/i).first()).toBeVisible();
});

test("officer sign-in reaches the records view with officer affordances", async ({ page }) => {
  await signIn(page, "dld@officer.com");
  await page.goto("/records");
  await expect(page.getByText("Officer view")).toBeVisible();
});

test("officer approves a pending record through the browser", async ({ page }) => {
  const name = "E2E approve flow";
  const { id } = await createPendingRecord(name);
  try {
    await signIn(page, "dld@officer.com");
    await page.goto(`/records/${id}`);
    await expect(page.getByText(name)).toBeVisible();
    await page.click('button:has-text("Approve")');
    await expect(page.getByText("Approved", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    const row = await readBack(id);
    expect(row.approval_status).toBe("approved");
    expect(row.reviewed_by).not.toBeNull();
  } finally {
    await cleanup(id);
  }
});

test("officer rejects with a reason and the reason is shown", async ({ page }) => {
  const name = "E2E reject flow";
  const { id } = await createPendingRecord(name);
  try {
    await signIn(page, "dld@officer.com");
    await page.goto(`/records/${id}`);
    page.on("dialog", async (dialog) => {
      expect(dialog.type()).toBe("prompt");
      await dialog.accept("needs scale photo");
    });
    await page.click('button:has-text("Reject")');
    await expect(page.getByText("needs scale photo")).toBeVisible({ timeout: 15_000 });
    const row = await readBack(id);
    expect(row.approval_status).toBe("rejected");
    expect(row.rejection_reason).toBe("needs scale photo");
  } finally {
    await cleanup(id);
  }
});

test("botanist sign-in does not see officer review affordances", async ({ page }) => {
  const name = "E2E role gate";
  const { id } = await createPendingRecord(name);
  try {
    await signIn(page, "dld@botanist.com");
    await page.goto(`/records/${id}`);
    await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  } finally {
    await cleanup(id);
  }
});
