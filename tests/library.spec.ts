import { expect, test } from '@playwright/test';

test.describe('UGS Web Hub library pages', () => {
  test('direct game pages load their embedded player shell', async ({ page }) => {
    const response = await page.goto('/games/cl1on1soccer.html');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/really cool flash game/i);
    await expect(page.locator('#flash-container')).toBeVisible();
    await expect(page.locator('#box-top')).toBeVisible();
    await expect(page.locator('script[src*="ruffle"]')).toHaveCount(1);
  });

  test('library game pages provide publisher content before launch', async ({ page }) => {
    const response = await page.goto('/library/cl1on1soccer.html');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/1 On 1 Soccer \| UGS Web Hub Library/i);
    await expect(page.getByRole('heading', { name: /1 On 1 Soccer/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /What To Expect/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Playing Notes/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Play 1 On 1 Soccer/i })).toHaveAttribute('href', '../games/cl1on1soccer.html');

    await page.getByRole('link', { name: /Browse Library/i }).click();
    await expect(page).toHaveURL(/\/index\.html\?hub=1#hub$/i);
    await expect(page.getByRole('heading', { name: /Find your next tab destroyer/i })).toBeVisible();
    await expect(page.locator('#games .card').first()).toBeVisible();
  });
});
