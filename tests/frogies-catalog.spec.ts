import { test, expect } from '@playwright/test';

test('Frogie games appear in the main library and open their own launch pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find a game' })).toBeVisible();
  const counts = await page.evaluate(() => ({
    existing: (window as any).rawGames.length,
    frogies: (window as any).frogiesGames.length,
  }));
  expect(counts.frogies).toBe(231);
  await expect(page.locator('#count')).toHaveText(String(counts.existing + counts.frogies));

  await page.getByRole('button', { name: 'Frogie’s games' }).click();
  await expect(page.locator('#games .card')).toHaveCount(counts.frogies);
  await expect(page.locator('#games .card').first()).toContainText('Frogie’s Arcade');
  await expect(page.locator('#games .card').first()).toContainText('Needs Internet');

  await page.locator('#search').fill('geometry dash');
  const card = page.locator('#games .card').filter({ has: page.locator('h3', { hasText: 'geometry dash' }) }).first();
  await card.click();
  const dialog = page.getByRole('dialog', { name: "Frogie's Arcade" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#frogiesFrame')).toHaveAttribute('src', /frogiesarcade\.net\/iframe\.html\?url=.*gdlite/);
  await expect(dialog.locator('#frogiesNewTabLink')).toHaveAttribute('href', /frogiesarcade\.net\/iframe\.html\?url=.*gdlite/);
  await dialog.getByRole('button', { name: 'Back to games' }).click();
  await expect(dialog).toBeHidden();

  await page.locator('#search').fill('roblox');
  await page.locator('#games .card').filter({ has: page.locator('h3', { hasText: 'roblox' }) }).first().click();
  await expect(dialog.locator('#frogiesFrame')).toHaveAttribute('src', /frogiesarcade\.net\/algebra\.html\?url=https:\/\/nowgg\.fun\/apps\/a\/19900\/b\.html/);
});
