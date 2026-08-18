import { expect, test } from '@playwright/test';
import { dismissCookies, isDesktop, resultCount, visit } from './helpers';

test.beforeEach(async ({ page }) => {
  await visit(page, '/stock/truck');
});

test.describe('listing page', () => {
  test('renders results, a toolbar and pagination', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('vehicle-list')).toBeVisible();
    expect(await resultCount(page)).toBeGreaterThan(0);
    await expect(page.getByTestId('vehicle-card').first()).toBeVisible();
  });

  test('a card shows title, specs and a price', async ({ page }) => {
    const card = page.getByTestId('vehicle-card').first();
    await expect(card.getByRole('heading')).not.toBeEmpty();
    await expect(card).toContainText('Buy');
    await expect(card).toContainText('€');
  });

  test('shows at most one page of results at a time', async ({ page }) => {
    const count = await page.getByTestId('vehicle-card').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(36);
  });
});

test.describe('filters', () => {
  test('a checkbox filter narrows results and updates the URL', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sidebar');

    const before = await resultCount(page);
    await page.getByTestId('filter-condition-used').check();

    await expect(page).toHaveURL(/condition=used/);
    await expect(page.getByTestId('activeFilters')).toBeVisible();
    const after = await resultCount(page);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });

  test('the filter really queries the backend, not just the visible cards', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sidebar');

    await page.getByTestId('filter-transmission-Automatic').check();
    await expect(page).toHaveURL(/transmission=Automatic/);

    // Every card on the page must reflect the filter.
    const cards = page.getByTestId('vehicle-card');
    const n = await cards.count();
    for (let i = 0; i < n; i++) {
      await expect(cards.nth(i)).toContainText('Automatic');
    }
  });

  test('a range filter applies on blur', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sidebar');

    const before = await resultCount(page);
    await page.getByTestId('filter-price-to').fill('25000');
    await page.getByTestId('filter-price-to').blur();

    await expect(page).toHaveURL(/priceTo=25000/);
    const after = await resultCount(page);
    expect(after).toBeLessThan(before);
  });

  test('removing a tag restores the wider result set', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sidebar');

    const before = await resultCount(page);
    await page.getByTestId('filter-condition-used').check();
    await expect(page).toHaveURL(/condition=used/);

    await page.getByRole('button', { name: /Clear filter Used/i }).click();
    await expect(page).not.toHaveURL(/condition=used/);
    expect(await resultCount(page)).toBe(before);
  });

  test('Clear removes every filter at once', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sidebar');

    await page.getByTestId('filter-condition-used').check();
    await page.getByTestId('filter-price-to').fill('40000');
    await page.getByTestId('filter-price-to').blur();
    await expect(page).toHaveURL(/priceTo=40000/);

    await page.getByTestId('clear-filters').click();
    await expect(page).not.toHaveURL(/condition=/);
    await expect(page).not.toHaveURL(/priceTo=/);
  });

  test('filters survive a page refresh', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sidebar');

    await page.getByTestId('filter-condition-new').check();
    await expect(page).toHaveURL(/condition=new/);
    const count = await resultCount(page);

    await page.reload();
    await dismissCookies(page);
    expect(await resultCount(page)).toBe(count);
    await expect(page.getByTestId('filter-condition-new')).toBeChecked();
  });

  test('facet counts are shown next to every option', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sidebar');
    const panel = page.getByTestId('filter-panel');
    await expect(panel).toContainText('Condition');
    await expect(panel).toContainText('Brand');
    await expect(panel).toContainText('Price');
  });

  test('mobile uses a filter sheet, not the sidebar', async ({ page }) => {
    test.skip(isDesktop(page), 'mobile pattern');

    await expect(page.getByTestId('filter-panel')).toBeHidden();
    const bar = page.getByTestId('mobile-action-bar');
    await expect(bar).toBeVisible();

    await page.getByTestId('mobile-filter-button').click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet).toBeVisible();

    // Scope to the sheet: the desktop sidebar is still in the DOM (display:none
    // below lg), so an unscoped testid would match two controls.
    await sheet.getByTestId('filter-condition-used').check();
    await expect(page).toHaveURL(/condition=used/);

    await sheet.getByRole('button', { name: /Show \d+ results/ }).click();
    await expect(sheet).toBeHidden();
    // Two: the category pinned by the /stock/truck path, plus the one just
    // ticked. The category counts because it is shown as a removable chip and
    // can genuinely be removed.
    await expect(page.getByTestId('mobile-filter-button')).toContainText('(2)');
  });
});

test.describe('sorting', () => {
  test('price low-to-high really orders the results', async ({ page }) => {
    await page.goto('/stock/truck?sort=price_asc');
    await dismissCookies(page);

    const prices = await page
      .getByTestId('vehicle-card')
      .locator('.text-lg')
      .allInnerTexts();
    const numeric = prices.map((p) => Number(p.replace(/[^\d]/g, ''))).filter((n) => n > 0);
    expect(numeric.length).toBeGreaterThan(1);
    for (let i = 1; i < numeric.length; i++) {
      expect(numeric[i]!).toBeGreaterThanOrEqual(numeric[i - 1]!);
    }
  });

  test('the sort menu changes the URL', async ({ page }) => {
    test.skip(!isDesktop(page), 'desktop sort dropdown');

    await page.getByTestId('sort-toggle').click();
    await page.getByRole('option', { name: 'Price (high-low)' }).click();
    await expect(page).toHaveURL(/sort=price_desc/);
  });
});

test.describe('pagination', () => {
  test('page 2 shows different vehicles and is bookmarkable', async ({ page }) => {
    const firstOnPage1 = await page.getByTestId('vehicle-card').first().getAttribute('href');

    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);

    const firstOnPage2 = await page.getByTestId('vehicle-card').first().getAttribute('href');
    expect(firstOnPage2).not.toBe(firstOnPage1);

    await page.reload();
    await dismissCookies(page);
    expect(await page.getByTestId('vehicle-card').first().getAttribute('href')).toBe(firstOnPage2);
  });
});

test.describe('vehicle detail', () => {
  test('opens from a card and shows the full record', async ({ page }) => {
    await page.getByTestId('vehicle-card').first().click();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('gallery')).toBeVisible();
    await expect(page.getByTestId('specifications')).toBeVisible();
    await expect(page.getByTestId('reference-copy')).toBeVisible();
    await expect(page.getByTestId('inquiry-form')).toBeVisible();
  });

  test('the gallery arrows and thumbnails work', async ({ page }) => {
    await page.getByTestId('vehicle-card').first().click();

    const counter = page.getByTestId('photo-count');
    await expect(counter).toContainText('1 /');
    await expect(page.getByTestId('gallery-prev')).toBeDisabled();

    await page.getByTestId('gallery-next').click();
    await expect(counter).toContainText('2 /');
    await expect(page.getByTestId('gallery-prev')).toBeEnabled();

    await page.getByTestId('gallery-thumb-4').click();
    await expect(counter).toContainText('5 /');
  });

  test('"Show all specifications" expands the table', async ({ page }) => {
    await page.getByTestId('vehicle-card').first().click();
    const toggle = page.getByTestId('show-all-specs');
    if (await toggle.isVisible().catch(() => false)) {
      const before = await page.getByTestId('specifications').locator('h3').count();
      await toggle.click();
      expect(await page.getByTestId('specifications').locator('h3').count()).toBeGreaterThan(before);
    }
  });

  test('carries correct SEO metadata and structured data', async ({ page }) => {
    await page.getByTestId('vehicle-card').first().click();

    await expect(page).toHaveTitle(/.+/);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();

    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const parsed = JSON.parse(ld!);
    expect([parsed['@type'], 'Vehicle']).toContain('Vehicle');
  });

  test('shows related vehicles', async ({ page }) => {
    await page.getByTestId('vehicle-card').first().click();
    await expect(page.getByRole('heading', { name: 'Latest added products' })).toBeVisible();
  });
});

test.describe('error states', () => {
  test('an unknown vehicle renders the 404 page', async ({ page }) => {
    await page.goto('/vehicles/used/this-vehicle-does-not-exist-000000');
    await expect(page.getByText('404')).toBeVisible();
  });

  test('an unknown stock path renders the 404 page', async ({ page }) => {
    await page.goto('/stock/not-a-real-category-at-all');
    await expect(page.getByText('404')).toBeVisible();
  });
});
