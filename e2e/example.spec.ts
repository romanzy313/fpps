import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/FPPS/);
});

test("connect peers", async ({ browser }) => {
  // Create a new incognito browser context.
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await page1.goto("/");

  // click on create-room-button
  // await page.click("#create-room-button");
  await page1.getByTestId("create-room-button").click();

  // check for text "Waiting for peer"
  await expect(page1.getByTestId("peer-status-text")).toHaveText(
    "Waiting for peer",
  );

  const shareLink = await page1.getByTestId("share-link-url").innerText();

  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();

  await page2.goto(shareLink);

  await expect(page1.getByTestId("peer-status-text")).toContainText(
    "Connected",
    { ignoreCase: true },
  );
  await expect(page2.getByTestId("peer-status-text")).toContainText(
    "Connected",
    { ignoreCase: true },
  );
  // Gracefully close up everything
  await ctx1.close();
  await ctx2.close();
});

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });
