import { test, expect } from '@playwright/test';

test('Frogie games appear in the main library and open their own launch pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find a game' })).toBeVisible();
  const counts = await page.evaluate(() => ({
    existing: (window as any).rawGames.length,
    frogies: (window as any).frogiesGames.length,
  }));
  expect(counts.frogies).toBe(231);
  const uniqueFrogies = await page.evaluate(() => {
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const seen = new Set((window as any).rawGames.map((game: any) => normalize(game.name)));
    return (window as any).frogiesGames.filter((game: any) => {
      const name = normalize(game.name);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    }).length;
  });
  expect(uniqueFrogies).toBe(103);
  await expect(page.locator('#games .card')).toHaveCount(Number(await page.locator('#count').textContent()));
  await expect(page.locator('#games .card.source-frogies')).toHaveCount(uniqueFrogies);
  await expect(page.locator('#games .card:not(.source-frogies):not(.source-gnmath)')).toHaveCount(counts.existing);
  await expect(page.getByRole('button', { name: 'Frogie’s games' })).toHaveCount(0);

  await page.locator('#search').fill('geometry dash');
  const card = page.locator('#games .card.source-frogies').filter({ has: page.locator('h3', { hasText: 'geometry dash' }) }).first();
  await expect(card).toContainText('Needs Internet');
  await card.click();
  const dialog = page.getByRole('dialog', { name: "Frogie's Arcade" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#frogiesFrame')).toHaveAttribute('src', /frogiesarcade\.net\/iframe\.html\?url=.*gdlite/);
  await expect(dialog.locator('#frogiesNewTabLink')).toHaveAttribute('href', /frogiesarcade\.net\/iframe\.html\?url=.*gdlite/);
  await dialog.getByRole('button', { name: 'Back to games' }).click();
  await expect(dialog).toBeHidden();

  await page.locator('#search').fill('roblox');
  await page.locator('#games .card.source-frogies').filter({ has: page.locator('h3', { hasText: 'roblox' }) }).first().click();
  await expect(dialog.locator('#frogiesFrame')).toHaveAttribute('src', /frogiesarcade\.net\/algebra\.html\?url=https:\/\/nowgg\.fun\/apps\/a\/19900\/b\.html/);
});
