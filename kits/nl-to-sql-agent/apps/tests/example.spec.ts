import { test, expect, type Page } from '@playwright/test';

// Fail closed exactly like apps/actions/login.ts: the demo credentials must be
// explicitly configured. There is no fallback to hardcoded demo/demo values.
function demoCredentials() {
  const username = process.env.DEMO_USERNAME;
  const password = process.env.DEMO_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'DEMO_USERNAME and DEMO_PASSWORD must be configured to run the E2E suite.'
    );
  }
  return { username, password };
}

async function login(page: Page) {
  const { username, password } = demoCredentials();

  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Should redirect to home page and show the main NL-to-SQL UI
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Ask your database a question')).toBeVisible();
}

if (process.env.DEMO_AUTH_ENABLED === "true") {
  test.describe('Queryline E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Start from login page
      await page.goto('/login');
    });

    test('should login with configured demo credentials', async ({ page }) => {
      const { username, password } = demoCredentials();

      // Fill in the login form with configured credentials
      await page.fill('input[name="username"]', username);
      await page.fill('input[name="password"]', password);

      // Submit the form
      await page.click('button[type="submit"]');

      // Should redirect to home page and show the main NL-to-SQL UI
      await expect(page).toHaveURL('/');
      await expect(page.locator('text=Ask your database a question')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Fill in the login form with wrong credentials
      await page.fill('input[name="username"]', 'wrong');
      await page.fill('input[name="password"]', 'wrong');

      // Submit the form
      await page.click('button[type="submit"]');

      // Should show the invalid credentials error
      await expect(page.locator('text=Invalid username or password')).toBeVisible();
    });

    test('should allow asking a question after login', async ({ page }) => {
      const { username, password } = demoCredentials();

      await page.fill('input[name="username"]', username);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      // Wait for the main NL-to-SQL UI
      await expect(page.locator('text=Ask your database a question')).toBeVisible();

      // Fill in a question
      await page.fill('textarea[placeholder="Enter your question about the database..."]', 'Show me all users');

      // Submit the question
      await page.click('button:has-text("Ask Question")');

      // Submitting must invoke the flow. Assert an outcome that does not vanish
      // when the request settles quickly: either the loading state or the result.
      await expect(
        page
          .locator('button:has-text("Ask Question")[disabled]')
          .or(page.locator('text=Query Results'))
          .or(page.locator('text=Generated SQL'))
          .first()
      ).toBeVisible();
    });
  });
}

  test('should persist theme preference', async ({ page }) => {
    const { username, password } = demoCredentials();

    await page.goto('/login');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Ask your database a question')).toBeVisible();

    // Click the theme toggle (shown as a dark-mode toggle button)
    await page.click('button[aria-label="Switch to dark mode"]');

    // Reload the page
    await page.reload();

    await expect(page.locator('text=Ask your database a question')).toBeVisible();

    // Should still be in dark mode (dark class on html element)
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });

  test('system theme follows the light OS preference', async ({ page }) => {
    // With no stored preference, the app resolves "system" from the OS.
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/login');

    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDark).toBe(false);
  });

  test('system theme follows the dark OS preference', async ({ page }) => {
    // emulateMedia must be set before navigation so the pre-hydration script
    // in app/layout.tsx can resolve prefers-color-scheme.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');

    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDark).toBe(true);
  });

  test('system theme live-updates when the OS preference changes', async ({ page }) => {
    await login(page);

    // Prefer the OS theme, then reload so the toggle re-applies it.
    await page.evaluate(() => localStorage.setItem('nl-to-sql-theme', 'system'));
    await page.reload();
    await expect(page.locator('text=Ask your database a question')).toBeVisible();

    // Light OS preference -> no dark class.
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.classList.contains('dark'))
    ).toBe(false);

    // Switching the OS preference to dark must apply dark without a reload.
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.classList.contains('dark'))
    ).toBe(true);
  });
// Mobile History navigation (Batch E1, Issue #16).
// These run against baseURL http://localhost:3000 (playwright.config.ts),
// matching the documented `npm run dev` port.
test.describe('Mobile navigation (Mobile History reachability)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('mobile user can open the menu and navigate to History', async ({ page }) => {
    const { username, password } = demoCredentials();
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Ask your database a question')).toBeVisible();

    // Desktop nav is hidden (via the `hidden` class) on the mobile viewport.
    // `hidden` removes it from layout but keeps it in the DOM, so assert on
    // visibility rather than element count.
    await expect(page.locator('nav.md\\:flex')).toBeHidden();

    // Open the accessible mobile menu.
    await page.click('button[aria-label="Open navigation"]');
    await expect(page.locator('nav[aria-label="Mobile navigation"]')).toBeVisible();
    await expect(page.locator('nav[aria-label="Mobile navigation"] >> text=History')).toBeVisible();

    // Navigate via the mobile menu.
    await page.click('nav[aria-label="Mobile navigation"] >> text=History');
    await expect(page).toHaveURL('/history');
    await expect(page.getByRole('heading', { name: 'Query History' })).toBeVisible();
  });
});
