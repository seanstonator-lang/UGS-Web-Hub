import { test, expect } from '@playwright/test';

test('Frogie’s Arcade opens inside UGS and returns to the hub', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Landing navigation' }).getByRole('button', { name: 'Frogie’s Arcade' }).click();
  const dialog = page.getByRole('dialog', { name: "Frogie's Arcade" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('iframe')).toHaveAttribute('src', 'https://frogiesarcade.net/');
  await expect(dialog.getByRole('link', { name: /Open in new tab/ })).toHaveAttribute('href', 'https://frogiesarcade.net/');
  await dialog.getByRole('button', { name: 'Back to UGS' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#frogiesFrame')).toHaveAttribute('src', 'about:blank');
  await page.getByRole('button', { name: 'Enter the Hub' }).click();
  await page.getByRole('button', { name: 'Open Frogie’s Arcade' }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
