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

  await page2.goto(shareLink, { waitUntil: "networkidle" });

  await expect(page1.getByTestId("peer-status-text")).toContainText(
    "Connected",
    { ignoreCase: true, timeout: 10_000 },
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

  await page2.goto(shareLink, { waitUntil: "networkidle" });

  await expect(page1.getByTestId("peer-status-text")).toContainText(
    "Connected",
    { ignoreCase: true, timeout: 10_000 },
  );
  await expect(page2.getByTestId("peer-status-text")).toContainText(
    "Connected",
    { ignoreCase: true },
  );

  // in memory-limit is 50mb total
  const TEST_FILE_COUNT = 20;
  const TEST_FILE_SIZE = 2 << 19; // 1MB

  const testFiles = generateTestFiles({
    count: TEST_FILE_COUNT,
    sizeBytes: TEST_FILE_SIZE,
  });

  await page1.getByTestId("upload-files-input").setInputFiles(testFiles);

  await expect(page1.getByTestId("my-transfer-status-text")).toContainText(
    "Waiting for peer to start downloading",
  );
  await expect(page1.getByTestId("my-file-count")).toContainText(
    TEST_FILE_COUNT.toString(),
  );

  await expect(page2.getByTestId("peer-transfer-status-text")).toContainText(
    "Waiting to start the download",
  );
  await expect(page2.getByTestId("peer-file-count")).toContainText(
    TEST_FILE_COUNT.toString(),
  );

  // Download

  const downloadPromise = page2.waitForEvent("download");

  await page2.getByTestId("start-download-button").click();

  await expect(page1.getByTestId("my-transfer-status-text")).toContainText(
    "Completed",
    {
      timeout: 20000,
    },
  );
  await expect(page2.getByTestId("peer-transfer-status-text")).toContainText(
    "Completed",
  );

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
