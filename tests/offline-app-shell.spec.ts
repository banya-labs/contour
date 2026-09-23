import { expect, test } from "@playwright/test";

test("offline app shell is registered by the production layout", async ({ page }) => {
  await page.goto("/agent");
  await expect.poll(async () => page.evaluate(() => "serviceWorker" in navigator)).toBe(true);
});
