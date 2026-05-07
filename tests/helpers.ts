import { Page, expect } from '@playwright/test';

export async function enterHub(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Enter the Hub/i }).click();
  await expect(page.getByRole('heading', { name: /Find your next tab destroyer/i })).toBeVisible();
}
