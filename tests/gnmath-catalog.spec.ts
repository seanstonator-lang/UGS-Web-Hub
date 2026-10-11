import { expect, test } from '@playwright/test';

test('GN Math titles join the shared catalog and open their game', async ({ page }) => {
  await page.goto('/');
  const imported = await page.evaluate(() => (window as any).gnMathGames.length);
  expect(imported).toBe(837);
  await expect(page.locator('#games .card.source-gnmath')).toHaveCount(435);
  await expect(page.locator('#count')).toHaveText('2334');
  await expect(page.locator('#games .card.source-frogies')).toHaveCount(103);
  await expect(page.locator('#games .card:not(.source-frogies):not(.source-gnmath)')).toHaveCount(1796);

  await page.locator('#search').fill('attack hole');
  const card = page.locator('#games .card.source-gnmath').filter({ has: page.locator('h3', { hasText: 'Attack Hole' }) });
  await expect(card).toHaveCount(1);
  await card.click();
  const dialog = page.getByRole('dialog', { name: 'GN Math' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#hostedGameSource')).toContainText('From GN Math');
  await expect(dialog.locator('#frogiesFrame')).toHaveAttribute('src', /gn-math\.dev\/.*\/13-fix2\.html/);
  await dialog.getByRole('button', { name: 'Back to games' }).click();
  await expect(dialog).toBeHidden();
});
