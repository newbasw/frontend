import { expect, test } from '@playwright/test';
import { dismissCookies, signIn, signInAndExpectSuccess, visit } from './helpers';

/**
 * Authentication, favourites and enquiries — the flows that must not be fake.
 *
 * Registration creates a genuinely new account on every run (the email is
 * timestamped), so "registration succeeds" is proven rather than assumed.
 * TEST_USER_EMAIL / TEST_USER_PASSWORD from the environment are used for the
 * login-specific checks so they do not depend on the registration run.
 */

// These specs share one demo account and toggle its favourites, so they must
// not run concurrently with each other.
test.describe.configure({ mode: 'serial' });

const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

// Serial mode means one test's session would otherwise leak into the next, so
// every test starts from a known signed-out state.
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

function freshAccount() {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    email: `bw.e2e.${stamp}@example.com`,
    password: `Test${stamp.slice(-6)}pw`,
    firstName: 'Test',
    lastName: 'Buyer',
  };
}

test.describe('registration', () => {
  test('creates a new account and starts a session', async ({ page }) => {
    const account = freshAccount();

    await visit(page, '/register');

    await page.getByLabel('First name').fill(account.firstName);
    await page.getByLabel('Last name').fill(account.lastName);
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Create account' }).click();

    // Either we land in the account area, or Supabase is configured to require
    // email confirmation first — both are valid, working outcomes.
    const confirmed = page.getByTestId('register-confirm');
    await Promise.race([
      page.waitForURL('**/account', { timeout: 20_000 }).catch(() => null),
      confirmed.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => null),
    ]);

    if (await confirmed.isVisible().catch(() => false)) {
      await expect(confirmed).toContainText(/Check your inbox/i);
    } else {
      await expect(page).toHaveURL(/\/account/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(account.firstName);
    }
  });

  test('rejects a weak password with a field-level error', async ({ page }) => {
    const account = freshAccount();
    await visit(page, '/register');

    await page.getByLabel('First name').fill(account.firstName);
    await page.getByLabel('Last name').fill(account.lastName);
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText(/Use at least 8 characters/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test('rejects a duplicate email address', async ({ page }) => {
    test.skip(!TEST_EMAIL, 'TEST_USER_EMAIL not configured');

    await visit(page, '/register');

    await page.getByLabel('First name').fill('Dup');
    await page.getByLabel('Last name').fill('Licate');
    await page.getByLabel('Email address').fill(TEST_EMAIL!);
    await page.getByLabel('Password').fill('Str0ngPassword1');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByTestId('register-error')).toContainText(/already exists/i);
  });
});

test.describe('login', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not configured');

  test('correct credentials sign the user in', async ({ page }) => {
    await signInAndExpectSuccess(page, TEST_EMAIL!, TEST_PASSWORD!);
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByText(TEST_EMAIL!)).toBeVisible();
  });

  test('incorrect credentials are rejected without revealing which field is wrong', async ({ page }) => {
    await signIn(page, TEST_EMAIL!, 'definitely-not-the-password');
    await expect(page.getByTestId('login-error')).toContainText(/Incorrect email address or password/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('the session survives a refresh', async ({ page }) => {
    await signInAndExpectSuccess(page, TEST_EMAIL!, TEST_PASSWORD!);
    await expect(page).toHaveURL(/\/account/);
    await page.reload();
    await expect(page.getByText(TEST_EMAIL!)).toBeVisible();
  });

  test('login returns the user to where they came from', async ({ page }) => {
    await visit(page, '/favorites');
    await expect(page).toHaveURL(/\/login\?next=%2Ffavorites/);

    await page.getByLabel('Email address').fill(TEST_EMAIL!);
    await page.getByLabel('Password').fill(TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/favorites/);
  });
});

test.describe('protected routes', () => {
  test('signed-out users are redirected away from /account', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
  });

  test('signed-out users are redirected away from /favorites', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('logout', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not configured');

  test('destroys the session and re-locks protected pages', async ({ page }) => {
    await signInAndExpectSuccess(page, TEST_EMAIL!, TEST_PASSWORD!);
    await expect(page).toHaveURL(/\/account/);

    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL('/');

    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('favourites', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not configured');

  test('a signed-out favourite click sends the user to login', async ({ page }) => {
    await visit(page, '/stock/truck');
    await page.getByTestId('favorite-button').first().click();
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test('a saved vehicle persists across a refresh and appears in the account', async ({ page }) => {
    await signInAndExpectSuccess(page, TEST_EMAIL!, TEST_PASSWORD!);
    await visit(page, '/stock/truck');

    // Pin the card by href, not by position: saving triggers a server refresh
    // that re-renders the grid, so a positional locator goes stale mid-test.
    const href = await page.getByTestId('vehicle-card').first().getAttribute('href');
    const card = page.locator(`[data-testid="vehicle-card"][href="${href}"]`);
    const favorite = card.getByTestId('favorite-button');

    // Start from a known state.
    if ((await favorite.getAttribute('aria-pressed')) === 'true') {
      await favorite.click();
      await expect(favorite).toHaveAttribute('aria-pressed', 'false');
    }

    await favorite.click();
    await expect(favorite).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await dismissCookies(page);
    await expect(card.getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');

    // The account may already hold other saved vehicles, so assert that this
    // one is present rather than that it happens to sort first.
    await page.goto('/favorites');
    const saved = page.locator(`[data-testid="vehicle-card"][href="${href}"]`);
    await expect(saved).toHaveCount(1);

    // Clean up so the test is repeatable.
    await saved.getByTestId('favorite-button').click();
    await expect(saved.getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('enquiries', () => {
  test('submitting an enquiry stores it and confirms to the user', async ({ page }) => {
    await visit(page, '/stock/truck');
    await page.getByTestId('vehicle-card').first().click();

    const form = page.getByTestId('inquiry-form');
    await form.getByLabel('Name').fill('E2E Buyer');
    await form.getByLabel('Email').fill(`bw.e2e.${Date.now()}@example.com`);
    await form.getByLabel('Message').fill('I would like more information about this vehicle, please.');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByTestId('inquiry-success')).toBeVisible({ timeout: 20_000 });
  });

  test('rejects an invalid email with a field error', async ({ page }) => {
    await visit(page, '/stock/truck');
    await page.getByTestId('vehicle-card').first().click();

    const form = page.getByTestId('inquiry-form');
    await form.getByLabel('Name').fill('E2E Buyer');
    await form.getByLabel('Email').fill('not-an-email');
    await form.getByLabel('Message').fill('This message is definitely long enough.');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });
});
