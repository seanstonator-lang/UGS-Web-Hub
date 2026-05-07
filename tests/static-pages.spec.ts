import { expect, test } from '@playwright/test';

test.describe('UGS Web Hub static pages', () => {
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

  test('homepage footer links open the support and content pages', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Guides/i }).click();
    await expect(page).toHaveURL(/\/guides\.html$/i);
    await expect(page.getByRole('heading', { name: /Browser Game Guides/i })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: /Collections/i }).click();
    await expect(page).toHaveURL(/\/collections\.html$/i);
    await expect(page.getByRole('heading', { name: /Game Collections/i })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: /Standards/i }).click();
    await expect(page).toHaveURL(/\/advertising\.html$/i);
    await expect(page.getByRole('heading', { name: /Advertising & Content Standards/i })).toBeVisible();

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

  test('missing pages return the current 404 response', async ({ page }) => {
    const response = await page.goto('/missing-page.html');

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/Page Not Found \| UGS Web Hub/i);
    await expect(page.getByRole('heading', { name: /Page Not Found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Hub/i })).toHaveAttribute('href', 'index.html');
  });
});
