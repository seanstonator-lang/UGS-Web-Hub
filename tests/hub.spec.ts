import { expect, test } from '@playwright/test';

test.describe('UGS Web Hub', () => {
  test('loads the landing page and enters the hub', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/UGS Web Hub/i);
    await expect(page.getByRole('heading', { name: /UGS Web Hub/i })).toBeVisible();

    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await expect(page.getByRole('heading', { name: /Find your next tab destroyer/i })).toBeVisible();
    await expect(page.locator('#games .card').first()).toBeVisible();
    await expect(page.locator('#count')).toContainText(/\d+/);
    await expect(page.locator('#visibleCount')).toContainText(/\d+/);
  });

  test('filters the catalog with search', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    const visibleCount = page.locator('#visibleCount');
    const search = page.locator('#search');
    const cards = page.locator('#games .card');

    await search.fill('mario');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(visibleCount).not.toHaveText('2222');
    await expect(page.locator('#games')).toContainText(/mario/i);
  });

  test('changes genre from the dropdown and updates summary', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await page.locator('#genreSelect').selectOption('platformer');

    await expect(page.locator('#activeGenreLabel')).toHaveText(/Jump Tech/i);
    await expect(page.locator('#genreSummaryText')).toHaveText(/Jump Tech/i);
    await expect(page.locator('#spotlightMeta')).toContainText(/title/i);
  });

  test('switches themes from the hub theme controls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await page.getByRole('button', { name: /Neon Grid/i }).click();

    await expect(page.locator('body')).toHaveAttribute('data-theme', 'neon-grid');
    await expect(page.locator('#activeThemeLabel')).toHaveText(/Neon Grid/i);
  });

  test('random pick updates spotlight and launch opens a game tab', async ({ page, context }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await page.getByRole('button', { name: /^Random Pick$/i }).click();
    await expect(page.locator('#spotlightTitle')).not.toHaveText(/Catalog Ready/i);

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /Launch/i }).click(),
    ]);

    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveURL(/\/games\//i);
    await popup.close();
  });

  test('reset view clears search and genre filter', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await page.locator('#search').fill('mario');
    await page.locator('#genreSelect').selectOption('platformer');
    await page.getByRole('button', { name: /Reset View/i }).click();

    await expect(page.locator('#search')).toHaveValue('');
    await expect(page.locator('#genreSelect')).toHaveValue('all');
    await expect(page.locator('#genreSummaryText')).toHaveText(/All Games/i);
  });
});
