import { expect, test } from '@playwright/test';
import { hasOwnerCreds, loginAsOwner, ownerEmail, ownerPassword } from './helpers/auth';

test.describe('customer-web smoke', () => {
  test('sign-in page renders and accepts owner login', async ({ page }) => {
    test.skip(!hasOwnerCreds, 'Set E2E_CUSTOMER_OWNER_EMAIL and E2E_CUSTOMER_OWNER_PASSWORD.');

    await page.goto('/auth/sign-in');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByPlaceholder('you@business.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();

    await page.getByPlaceholder('you@business.com').fill(ownerEmail!);
    await page.getByPlaceholder('Enter your password').fill(ownerPassword!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/market/, { timeout: 30_000 });
  });

  test('market survives reload without falling into the empty-state screen', async ({ page }) => {
    test.skip(!hasOwnerCreds, 'Set E2E_CUSTOMER_OWNER_EMAIL and E2E_CUSTOMER_OWNER_PASSWORD.');

    await loginAsOwner(page);
    await page.goto('/market');

    await expect(page.getByTestId('market-page')).toBeVisible();
    await expect(page.getByText('No categories available right now.')).toHaveCount(0);
    await expect(page.getByTestId('market-category-rail')).toBeVisible({ timeout: 30_000 });

    await page.reload();

    await expect(page.getByTestId('market-page')).toBeVisible();
    await expect(page.getByText('No categories available right now.')).toHaveCount(0);
    await expect(page.getByTestId('market-category-rail')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid^="market-category-"]').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('requests list loads and opens request details when a request exists', async ({ page }) => {
    test.skip(!hasOwnerCreds, 'Set E2E_CUSTOMER_OWNER_EMAIL and E2E_CUSTOMER_OWNER_PASSWORD.');

    await loginAsOwner(page);
    await page.goto('/manage-requests');

    await expect(page.getByText('No requests found for the current filters.')).toHaveCount(0);

    const firstRow = page.locator('[data-testid^="request-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    await firstRow.click();

    await expect(page).toHaveURL(/\/manage-requests\/.+/, { timeout: 30_000 });
    await expect(page.getByTestId('request-detail-page')).toBeVisible();
  });

  test('orders list loads and opens order details when an order exists', async ({ page }) => {
    test.skip(!hasOwnerCreds, 'Set E2E_CUSTOMER_OWNER_EMAIL and E2E_CUSTOMER_OWNER_PASSWORD.');

    await loginAsOwner(page);
    await page.goto('/track-orders?status=ongoing');

    const firstRow = page.locator('[data-testid^="order-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    await firstRow.click();

    await expect(page).toHaveURL(/\/track-orders\/.+/, { timeout: 30_000 });
    await expect(page.getByTestId('order-detail-page')).toBeVisible();
  });

  test('wallet page loads for owner accounts', async ({ page }) => {
    test.skip(!hasOwnerCreds, 'Set E2E_CUSTOMER_OWNER_EMAIL and E2E_CUSTOMER_OWNER_PASSWORD.');

    await loginAsOwner(page);
    await page.goto('/wallet');

    await expect(page.getByTestId('wallet-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Available balance')).toBeVisible();
  });
});
