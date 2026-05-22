import { expect, type Page } from '@playwright/test';

export const ownerEmail = process.env.E2E_CUSTOMER_OWNER_EMAIL;
export const ownerPassword = process.env.E2E_CUSTOMER_OWNER_PASSWORD;
export const hasOwnerCreds = Boolean(ownerEmail && ownerPassword);

export async function loginAsOwner(page: Page) {
  if (!ownerEmail || !ownerPassword) {
    throw new Error(
      'Missing E2E_CUSTOMER_OWNER_EMAIL or E2E_CUSTOMER_OWNER_PASSWORD for authenticated smoke tests.',
    );
  }

  await page.goto('/auth/sign-in');
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  await page.getByPlaceholder('you@business.com').fill(ownerEmail);
  await page.getByPlaceholder('Enter your password').fill(ownerPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/market/, { timeout: 30_000 });
}
