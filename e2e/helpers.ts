import { expect, type Page } from '@playwright/test';

/**
 * Dismiss the cookie dialog.
 *
 * It is rendered client-side from an effect, so it appears a beat *after*
 * navigation completes. Checking for it immediately finds nothing, and it then
 * pops up and intercepts clicks on anything near the bottom of the page (the
 * footer, most obviously). Wait for it, then decline.
 */
export async function dismissCookies(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Cookie consent dialog' });
  try {
    await dialog.waitFor({ state: 'visible', timeout: 3000 });
    await dialog.getByRole('button', { name: 'Decline' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Already dismissed for this browser context — nothing to do.
  }
}

/** Navigate and clear the consent dialog in one step. */
export async function visit(page: Page, path: string) {
  await page.goto(path);
  await dismissCookies(page);
}

/** Result count as a number, from the listing toolbar. */
export async function resultCount(page: Page): Promise<number> {
  const text = await page.getByTestId('results-count').innerText();
  return Number(text.replace(/[^\d]/g, ''));
}

export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/**
 * Sign in through the real login form.
 *
 * Waits for the session to actually exist before returning. Without this the
 * caller can navigate away while the login request is still in flight, land on
 * a page rendered as a guest, and fail for reasons that have nothing to do with
 * what it was testing.
 */
export async function signIn(page: Page, email: string, password: string) {
  await visit(page, '/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await Promise.race([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 }),
    page.getByTestId('login-error').waitFor({ state: 'visible', timeout: 20_000 }),
  ]);
}

/** Sign in and assert it worked, for tests that need a session to proceed. */
export async function signInAndExpectSuccess(page: Page, email: string, password: string) {
  await signIn(page, email, password);
  await expect(page.getByTestId('login-error')).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/login/);
}
