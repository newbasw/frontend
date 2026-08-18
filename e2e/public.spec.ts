import { expect, test } from '@playwright/test';
import { dismissCookies, visit } from './helpers';

test.beforeEach(async ({ page }) => {
  await visit(page, '/');
});

test.describe('homepage', () => {
  test('renders the chrome and the key sections', async ({ page }) => {
    await expect(page).toHaveTitle(/BAS World/i);
    await expect(page.getByRole('link', { name: 'BAS World home' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Why we go above and beyond/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Popular categories/i })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('the category bar links into stock', async ({ page }) => {
    const truck = page.getByTestId('category-bar').locator('a[href="/stock/truck"]');
    await expect(truck).toContainText(/Truck\(\d+\)/);
    await truck.click();
    await expect(page).toHaveURL(/\/stock\/truck/);
    await expect(page.getByTestId('results-count')).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('navigation', () => {
  test('the mega menu opens and links into a filtered listing', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop mega menu');
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width < 1024, 'mega menu is desktop-only');

    await page.getByRole('button', { name: 'Categories' }).click();
    const menu = page.getByTestId('mega-menu');
    await expect(menu).toBeVisible();

    await menu.getByTestId('category-1').hover();
    const brandLink = menu.getByRole('link', { name: 'Volvo' }).first();
    await expect(brandLink).toBeVisible();
    await brandLink.click();

    await expect(page).toHaveURL(/\/stock\/truck\/volvo/);
    await expect(page.getByTestId('vehicle-list')).toBeVisible();
  });

  test('Escape closes the mega menu', async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width < 1024, 'mega menu is desktop-only');

    await page.getByRole('button', { name: 'Categories' }).click();
    await expect(page.getByTestId('mega-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('mega-menu')).toBeHidden();
  });

  test('the mobile menu drills into a category', async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width >= 1024, 'mobile menu only below lg');

    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByTestId('mobile-menu');
    await expect(menu).toBeVisible();

    await menu.getByRole('button', { name: 'Categories' }).click();
    await menu.getByRole('button', { name: /^Truck\(\d+\)/ }).click();
    await menu.getByRole('link', { name: /View all truck/i }).click();

    await expect(page).toHaveURL(/\/stock\/truck/);
  });

  test('the footer links to the legal pages', async ({ page }) => {
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy policy' }).click();
    await expect(page).toHaveURL(/\/content\/privacy-disclaimer/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Privacy/i);
  });
});

test.describe('search', () => {
  test('suggests results while typing and navigates on Enter', async ({ page }) => {
    const input = page.getByRole('searchbox', { name: 'Search for vehicles' }).first();
    await input.click();
    await input.fill('Volvo');

    await expect(page.getByRole('listbox')).toBeVisible();
    await input.press('Enter');

    await expect(page).toHaveURL(/\/stock\/all\?q=Volvo/);
    await expect(page.getByTestId('results-count')).toContainText(/\d+/);
  });

  test('a nonsense query produces the empty state, not a crash', async ({ page }) => {
    await page.goto('/stock/all?q=zzzzqqqqnothingmatchesthis');
    await dismissCookies(page);
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('results-count')).toContainText('0');
  });

  test('a reference number goes straight to the vehicle', async ({ page }) => {
    await page.goto('/stock/all');
    await dismissCookies(page);
    const firstCard = page.getByTestId('vehicle-card').first();
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    const reference = await page.getByTestId('reference-copy').innerText();
    await page.goto(`/stock/all?q=${encodeURIComponent(reference.trim())}`);
    await expect(page.getByTestId('results-count')).toContainText('1');
  });
});
