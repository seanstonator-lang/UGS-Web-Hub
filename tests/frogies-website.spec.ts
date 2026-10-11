import { test, expect } from '@playwright/test';

test('a Frogie game opens inside UGS and returns to the shared catalog', async ({ page }) => {
  await page.goto('/');
  await page.locator('#search').fill('geometry dash');
  await page.locator('#games .card.source-frogies').first().click();
  const dialog = page.getByRole('dialog', { name: "Frogie's Arcade" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /frogiesarcade\.net/);
  await expect(dialog.getByRole('link', { name: /Open in new tab/ })).toHaveAttribute('href', /frogiesarcade\.net/);
  await dialog.getByRole('button', { name: 'Back to games' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#frogiesFrame')).toHaveAttribute('src', 'about:blank');
  await page.locator('#games .card.source-frogies').first().click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
