import { expect, test } from '@playwright/test';
import { enterHub } from './helpers';

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
    await enterHub(page);

    const visibleCount = page.locator('#visibleCount');
    const search = page.locator('#search');
    const cards = page.locator('#games .card');

    await search.fill('mario');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(visibleCount).not.toHaveText('2222');
    await expect(page.locator('#games')).toContainText(/mario/i);
  });

  test('keeps filtered counts logically consistent after search and genre changes', async ({ page }) => {
    await enterHub(page);

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
    await enterHub(page);

    await page.locator('#genreSelect').selectOption('platformer');

    await expect(page.locator('#activeGenreLabel')).toHaveText(/Jump Tech/i);
    await expect(page.locator('#genreSummaryText')).toHaveText(/Jump Tech/i);
    await expect(page.locator('#spotlightMeta')).toContainText(/title/i);
  });

  test('defaults to the full vault and lets you filter by platform type', async ({ page }) => {
    await enterHub(page);

    await expect(page.locator('#platformSelect')).toHaveValue('all');
    await expect(page.locator('#activePlatformLabel')).toHaveText(/Full Vault/i);

    const totalCount = Number(await page.locator('#count').textContent());
    await page.locator('#platformSelect').selectOption('flash');
    const flashCount = Number(await page.locator('#visibleCount').textContent());

    expect(flashCount).toBeGreaterThan(0);
    expect(flashCount).toBeLessThan(totalCount);
    await expect(page.locator('#activePlatformLabel')).toHaveText(/Flash/i);
    await expect(page.locator('#genreSummaryText')).toHaveText(/Flash/i);
  });

  test('shows emulation system filtering when emulation is selected', async ({ page }) => {
    await enterHub(page);

    await page.locator('#platformSelect').selectOption('emulated');

    await expect(page.locator('#systemSelectWrap')).toBeVisible();
    await page.locator('#systemSelect').selectOption({ index: 1 });

    const chosenSystem = await page.locator('#systemSelect').inputValue();
    expect(chosenSystem).not.toBe('all');
    await expect(page.locator('#activePlatformLabel')).toContainText(chosenSystem);
    await expect(page.locator('#genreSummaryText')).toContainText(chosenSystem);
    await expect(page.locator('#visibleCount')).not.toHaveText('0');
  });

  test('switches themes from the hub theme controls', async ({ page }) => {
    await enterHub(page);

    await page.getByRole('button', { name: /Neon Grid/i }).click();

    await expect(page.locator('body')).toHaveAttribute('data-theme', 'neon-grid');
    await expect(page.locator('#activeThemeLabel')).toHaveText(/Neon Grid/i);
  });

  test('random pick updates spotlight and launch opens the library page in the same tab', async ({ page }) => {
    await enterHub(page);

    await page.getByRole('button', { name: /^Random Pick$/i }).click();
    await expect(page.locator('#spotlightTitle')).not.toHaveText(/Catalog Ready/i);

    await page.locator('#spotlightBtn').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/library\//i);
    await expect(page.getByRole('link', { name: /^Play /i })).toHaveAttribute('href', /\.\.\/games\//i);
  });

  test('reset view clears search and genre filter', async ({ page }) => {
    await enterHub(page);

    await page.locator('#search').fill('mario');
    await page.locator('#genreSelect').selectOption('platformer');
    await page.getByRole('button', { name: /Reset View/i }).click();

    await expect(page.locator('#search')).toHaveValue('');
    await expect(page.locator('#genreSelect')).toHaveValue('all');
    await expect(page.locator('#genreSummaryText')).toHaveText(/All Games/i);
  });

  test('shows the empty-state spotlight when no games match the search', async ({ page }) => {
    await enterHub(page);

    await page.locator('#search').fill('zzzz-nothing-should-match-this');

    await expect(page.locator('#visibleCount')).toHaveText('0');
    await expect(page.locator('#games .card')).toHaveCount(0);
    await expect(page.locator('#spotlightTitle')).toHaveText(/No Matches Found/i);
    await expect(page.locator('#spotlightMeta')).toContainText(/Try another search/i);
    await expect(page.getByRole('button', { name: /No Launch/i })).toBeDisabled();
  });

  test('quick-start collections reshape the hub without typing a search', async ({ page }) => {
    await enterHub(page);

    await page.getByRole('button', { name: /Brain Burn/i }).click();

    await expect(page.locator('#genreSummaryText')).toHaveText(/Brain Burn/i);
    await expect(page.locator('#visibleCount')).not.toHaveText('2222');
    await expect(page.locator('#games .card')).toHaveCount(Number(await page.locator('#visibleCount').textContent()));
  });

  test('saves favorites and filters the hub to the saved lane', async ({ page }) => {
    await enterHub(page);

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

  test('surprise favorites launches from the saved pool', async ({ page }) => {
    await enterHub(page);

    const firstCard = page.locator('#games .card').first();
    const title = (await firstCard.locator('h3').textContent())?.trim();
    await firstCard.getByRole('button', { name: /Add to favorites/i }).click();

    await page.getByRole('button', { name: /Surprise Favorites/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/library\//i);
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();
    await expect(page.locator('#recentList')).toContainText(title || '');
  });

  test('tracks recently played games and lets you clear the list', async ({ page }) => {
    await enterHub(page);

    const firstCard = page.locator('#games .card').first();
    const title = (await firstCard.locator('h3').textContent())?.trim();

    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/library\//i);
    await page.goto('/');
    await page.getByRole('button', { name: /Enter the Hub/i }).click();
    await expect(page.locator('#recentList')).toContainText(title || '');
    await expect(page.getByRole('button', { name: /Play Again/i })).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: /Enter the Hub/i }).click();

    await expect(page.locator('#recentList')).toContainText(title || '');
    await page.getByRole('button', { name: /Clear Recent/i }).click();
    await expect(page.locator('#recentList')).toContainText(/Only your last 3 runs stay pinned here/i);
    await expect(page.getByRole('button', { name: /Clear Recent/i })).toBeDisabled();
  });

  test('keeps only the last three recently played games', async ({ page }) => {
    await enterHub(page);

    const titles: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const card = page.locator('#games .card').nth(i);
      titles.push(((await card.locator('h3').textContent()) || '').trim());
      await card.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/library\//i);
      await page.goto('/');
      await page.getByRole('button', { name: /Enter the Hub/i }).click();
    }

    await expect(page.locator('#recentList .recentItem')).toHaveCount(3);
    await expect(page.locator('#recentList')).toContainText(titles[3]);
    await expect(page.locator('#recentList')).toContainText(titles[2]);
    await expect(page.locator('#recentList')).toContainText(titles[1]);
    await expect(page.locator('#recentList')).not.toContainText(titles[0]);
  });
});
