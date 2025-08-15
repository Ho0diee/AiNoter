import { test, expect } from "@playwright/test"

test("visit homepage and browse", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Join the current Jam")).toBeVisible()
  await page.goto("/browse")
  await expect(page.getByText("Trending")).toBeVisible()
})

test("creator page loads", async ({ page }) => {
  await page.goto("/create")
  await expect(page.getByText("Creator Dashboard")).toBeVisible()
  await expect(page.getByText("Valid PromptScript")).toBeVisible()
})
