import { test, expect } from "@playwright/test";
import {
  assertFilesAreTheSame,
  generateTestFiles,
  unzipFromStream,
} from "./fileHelpers";

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

test("transfer files", async ({ browser }) => {
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

  const testFiles = generateTestFiles({
    count: 3,
    sizeBytes: 2 << 19, // 1MB
  });

  await page1.getByTestId("upload-files-input").setInputFiles(testFiles);

  await expect(
    page1.getByText("Waiting for peer to start downloading"),
  ).toBeVisible();
  await expect(page1.getByTestId("my-file-count")).toContainText("3");

  await expect(page2.getByText("Waiting to start the download")).toBeVisible();
  await expect(page2.getByTestId("peer-file-count")).toContainText("3");

  const downloadPromise = page2.waitForEvent("download");

  await page2.getByTestId("start-download-button").click();

  await expect(page1.getByText("Completed")).toBeVisible({
    timeout: 10000,
  });
  await expect(page2.getByText("Completed")).toBeVisible();

  const download = await downloadPromise;
  // download.saveAs("downloaded.zip");

  const afterTransfer = await unzipFromStream(
    await download.createReadStream(),
  );

  expect(assertFilesAreTheSame(testFiles, afterTransfer)).toBe(true);

  // Gracefully close up everything
  await ctx1.close();
  await ctx2.close();
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
