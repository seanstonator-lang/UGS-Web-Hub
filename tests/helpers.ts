import { Page, expect } from '@playwright/test';

export async function enterHub(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Find a game/i })).toBeVisible();
}
