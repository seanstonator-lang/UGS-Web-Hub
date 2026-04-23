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

  test('keeps filtered counts logically consistent after search and genre changes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    const totalCount = Number(await page.locator('#count').textContent());
    expect(totalCount).toBeGreaterThan(0);

    await page.locator('#search').fill('mario');
    await page.locator('#genreSelect').selectOption('platformer');

    const visibleCount = Number(await page.locator('#visibleCount').textContent());
    expect(visibleCount).toBeGreaterThanOrEqual(0);
    expect(visibleCount).toBeLessThanOrEqual(totalCount);
    expect(await page.locator('#games .card').count()).toBe(visibleCount);
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
      page.locator('#spotlightBtn').click(),
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

  test('shows the empty-state spotlight when no games match the search', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await page.locator('#search').fill('zzzz-nothing-should-match-this');

    await expect(page.locator('#visibleCount')).toHaveText('0');
    await expect(page.locator('#games .card')).toHaveCount(0);
    await expect(page.locator('#spotlightTitle')).toHaveText(/No Matches Found/i);
    await expect(page.locator('#spotlightMeta')).toContainText(/Try another search/i);
    await expect(page.getByRole('button', { name: /No Launch/i })).toBeDisabled();
  });

  test('saves favorites and filters the hub to the saved lane', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    const firstCard = page.locator('#games .card').first();
    const favoriteButton = firstCard.getByRole('button', { name: /Add to favorites/i });
    const title = (await firstCard.locator('h3').textContent())?.trim();

    await favoriteButton.click();

    await expect(page.locator('#favoriteCount')).toHaveText('1');
    await expect(page.getByRole('button', { name: /Favorites Only: On/i })).toHaveCount(0);

    await page.getByRole('button', { name: /Favorites Only: Off/i }).click();

    await expect(page.getByRole('button', { name: /Favorites Only: On/i })).toBeVisible();
    await expect(page.locator('#visibleCount')).toHaveText('1');
    await expect(page.locator('#genreSummaryText')).toHaveText(/Favorites/i);
    await expect(page.locator('#games .card')).toHaveCount(1);
    await expect(page.locator('#games')).toContainText(title || '');

    await page.reload();
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await expect(page.locator('#favoriteCount')).toHaveText('1');
    await expect(page.locator('#games .card').first().getByRole('button', { name: /Remove from favorites/i })).toBeVisible();
  });

  test('loads the privacy policy page with hub navigation links', async ({ page }) => {
    await page.goto('/privacy.html');

    await expect(page).toHaveTitle(/Privacy Policy \| UGS Web Hub/i);
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Last Updated/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Hub/i })).toHaveAttribute('href', 'index.html');
    await expect(page.getByRole('link', { name: /About Us/i })).toHaveAttribute('href', 'about.html');
    await expect(page.getByRole('link', { name: /Contact Us/i })).toHaveAttribute('href', 'contact.html');
  });

  test('loads the contact page with the support form wired up', async ({ page }) => {
    await page.goto('/contact.html');

    await expect(page).toHaveTitle(/Contact Us \| UGS Web Hub/i);
    await expect(page.getByRole('heading', { name: /Contact UGS Web Hub/i })).toBeVisible();
    await expect(page.locator('form')).toHaveAttribute('action', /formspree\.io\/f\/mzdvropy/);
    await expect(page.locator('#email')).toHaveAttribute('type', 'email');
    await expect(page.locator('#message')).toBeVisible();
    await expect(page.getByRole('link', { name: /About Us/i })).toHaveAttribute('href', 'about.html');
    await expect(page.getByRole('link', { name: /Back to Hub/i })).toHaveAttribute('href', 'index.html');
  });

  test('loads the about page with the main site links', async ({ page }) => {
    await page.goto('/about.html');

    await expect(page).toHaveTitle(/About \| UGS Web Hub/i);
    await expect(page.getByRole('heading', { name: /About UGS Web Hub/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /What It Is/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Hub/i })).toHaveAttribute('href', 'index.html');
    await expect(page.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', 'privacy.html');
    await expect(page.getByRole('link', { name: /Contact Us/i })).toHaveAttribute('href', 'contact.html');
  });

  test('homepage footer links open the support pages', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /About Us/i }).click();
    await expect(page).toHaveURL(/\/about\.html$/i);
    await expect(page.getByRole('heading', { name: /About UGS Web Hub/i })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: /Privacy Policy/i }).click();
    await expect(page).toHaveURL(/\/privacy\.html$/i);
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: /Contact Us/i }).click();
    await expect(page).toHaveURL(/\/contact\.html$/i);
    await expect(page.getByRole('heading', { name: /Contact UGS Web Hub/i })).toBeVisible();
  });

  test('back to hub links return from support pages to the homepage', async ({ page }) => {
    await page.goto('/privacy.html');
    await page.getByRole('link', { name: /Back to Hub/i }).click();
    await expect(page).toHaveURL(/\/index\.html$/i);
    await expect(page.getByRole('heading', { name: /UGS Web Hub/i })).toBeVisible();

    await page.goto('/contact.html');
    await page.getByRole('link', { name: /Back to Hub/i }).click();
    await expect(page).toHaveURL(/\/index\.html$/i);
    await expect(page.getByRole('heading', { name: /UGS Web Hub/i })).toBeVisible();
  });

  test('direct game pages load their embedded player shell', async ({ page }) => {
    const response = await page.goto('/games/cl1on1soccer.html');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/really cool flash game/i);
    await expect(page.locator('#flash-container')).toBeVisible();
    await expect(page.locator('#box-top')).toBeVisible();
    await expect(page.locator('script[src*="ruffle"]')).toHaveCount(1);
  });

  test('missing pages return the current 404 response', async ({ page }) => {
    const response = await page.goto('/missing-page.html');

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/Page Not Found \| UGS Web Hub/i);
    await expect(page.getByRole('heading', { name: /Page Not Found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Hub/i })).toHaveAttribute('href', 'index.html');
  });
});
