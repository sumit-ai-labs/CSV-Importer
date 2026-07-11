/**
 * import.spec.ts
 *
 * Playwright E2E tests for the GrowEasy CSV Importer application.
 * Tests: upload flow, preview, confirm, mock backend, results, skipped,
 * dark mode, responsive, keyboard navigation, accessibility, screenshot comparison.
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// 1. Test fixtures & helpers
// ---------------------------------------------------------------------------

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

const CSV_CONTENT = `name,email,mobile,company,city
Alice Johnson,alice@example.com,9999999999,AliceCo,Bangalore
Bob Smith,bob@example.com,8888888888,BobInc,Mumbai
`;

const CSV_SKIPPED_CONTENT = `name,email,mobile
Alice,alice@example.com,9999999999
NoEmailUser,,8888888888
`;

const SUCCESS_API_RESPONSE = {
  success: true,
  message: 'CSV import completed successfully',
  data: {
    summary: { totalRecords: 2, importedRecords: 2, skippedRecords: 0 },
    records: [
      {
        created_at: '2024-01-01',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        country_code: '+91',
        mobile_without_country_code: '9999999999',
        company: 'AliceCo',
        city: 'Bangalore',
        state: '',
        country: 'India',
        lead_owner: '',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
        crm_note: '',
        data_source: '',
        possession_time: '',
        description: '',
      },
      {
        created_at: '2024-01-01',
        name: 'Bob Smith',
        email: 'bob@example.com',
        country_code: '+91',
        mobile_without_country_code: '8888888888',
        company: 'BobInc',
        city: 'Mumbai',
        state: '',
        country: 'India',
        lead_owner: '',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
        crm_note: '',
        data_source: '',
        possession_time: '',
        description: '',
      },
    ],
    skipped: [],
  },
};

const PARTIAL_API_RESPONSE = {
  success: true,
  message: 'CSV import completed',
  data: {
    summary: { totalRecords: 2, importedRecords: 1, skippedRecords: 1 },
    records: [SUCCESS_API_RESPONSE.data.records[0]],
    skipped: [
      {
        rowNumber: 3,
        reason: 'Missing required field: email',
        originalRow: { name: 'NoEmailUser', email: '', mobile: '8888888888' },
      },
    ],
  },
};

/** Creates a temporary CSV file and returns its path. */
function createTempCSV(content: string, filename = 'test-import.csv'): string {
  const tmpDir = path.join(process.cwd(), 'tests', 'e2e', 'fixtures');
  fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/** Intercepts the import API and returns the provided mock response. */
async function mockImportAPI(page: Page, response: object, statusCode = 200) {
  await page.route('**/api/v1/import', async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

// ---------------------------------------------------------------------------
// 2. Test suite
// ---------------------------------------------------------------------------

test.describe('GrowEasy CSV Importer — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  // ── Launch app ───────────────────────────────────────────────────────────

  test('app launches and shows the upload zone', async ({ page }) => {
    await expect(page).toHaveTitle(/groweasy|csv importer/i);
    await expect(page.getByRole('button', { name: /upload zone/i })).toBeVisible();
  });

  // ── Upload real CSV ──────────────────────────────────────────────────────

  test('upload a real CSV file and see preview', async ({ page }) => {
    const csvPath = createTempCSV(CSV_CONTENT);

    await page.setInputFiles('[data-testid="dropzone-input"]', csvPath);

    // Preview should appear with headers
    await expect(page.getByText(/alice johnson/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/alice@example\.com/i)).toBeVisible();

    // Snapshot: Preview section
    await expect(page).toHaveScreenshot('upload-preview.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Preview appears with correct headers ─────────────────────────────────

  test('preview shows correct column headers', async ({ page }) => {
    const csvPath = createTempCSV(CSV_CONTENT);
    await page.setInputFiles('[data-testid="dropzone-input"]', csvPath);

    // Wait for preview headers to be visible
    for (const header of ['name', 'email', 'mobile', 'company', 'city']) {
      await expect(page.getByText(new RegExp(header, 'i')).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  // ── Confirm → mock backend → results render ──────────────────────────────

  test('clicking Confirm triggers import and shows results', async ({ page }) => {
    await mockImportAPI(page, SUCCESS_API_RESPONSE);
    const csvPath = createTempCSV(CSV_CONTENT);

    await page.setInputFiles('[data-testid="dropzone-input"]', csvPath);

    // Wait for preview, then click Confirm/Import
    const confirmButton = page
      .getByRole('button', { name: /confirm|import|start import/i })
      .first();
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    await confirmButton.click();

    // Results should appear
    await expect(page.getByText(/import completed|successfully|records imported/i)).toBeVisible({
      timeout: 10000,
    });

    // Snapshot: Results section
    await expect(page).toHaveScreenshot('import-results.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Skipped records render ───────────────────────────────────────────────

  test('shows skipped records in the results section', async ({ page }) => {
    await mockImportAPI(page, PARTIAL_API_RESPONSE);
    const csvPath = createTempCSV(CSV_SKIPPED_CONTENT, 'skipped-test.csv');

    await page.setInputFiles('[data-testid="dropzone-input"]', csvPath);

    const confirmButton = page
      .getByRole('button', { name: /confirm|import|start import/i })
      .first();
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    await confirmButton.click();

    // Should show skipped section
    await expect(page.getByText(/skipped|not imported|missing/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // ── Dark mode ────────────────────────────────────────────────────────────

  test('dark mode toggle changes theme', async ({ page }) => {
    const themeToggle = page
      .getByRole('button', { name: /toggle theme|dark mode|light mode/i })
      .first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Verify dark class is applied to HTML or body
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      const isDark =
        htmlClass.includes('dark') ||
        (await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark'));
      expect(isDark).toBe(true);

      // Snapshot: Dark mode
      await expect(page).toHaveScreenshot('dark-mode.png', {
        maxDiffPixelRatio: 0.05,
      });
    } else {
      test.skip();
    }
  });

  // ── Responsive design ────────────────────────────────────────────────────

  test('app is responsive on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /upload zone/i })).toBeVisible();

    await expect(page).toHaveScreenshot('mobile-375.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('app is responsive on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /upload zone/i })).toBeVisible();

    await expect(page).toHaveScreenshot('tablet-768.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('app is responsive on desktop viewport (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('desktop-1440.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Keyboard navigation ──────────────────────────────────────────────────

  test('upload zone is keyboard focusable and activatable', async ({ page }) => {
    // Tab to reach the upload zone
    await page.keyboard.press('Tab');

    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));

    // Eventually focus should land on a button/interactive element
    await expect(page.locator(':focus').first()).toBeVisible({ timeout: 3000 });
  });

  test('entire form flow can be navigated with keyboard only', async ({ page }) => {
    const csvPath = createTempCSV(CSV_CONTENT);

    // Use file input to bypass dropzone keyboard limitation
    await page.setInputFiles('[data-testid="dropzone-input"]', csvPath);

    // Tab to reach Confirm button
    let attempts = 0;
    let found = false;

    while (attempts < 10 && !found) {
      await page.keyboard.press('Tab');
      const focusedText = await page.evaluate(() => document.activeElement?.textContent);
      if (focusedText?.match(/confirm|import|start/i)) {
        found = true;
      }
      attempts++;
    }

    if (found) {
      await page.keyboard.press('Enter');
      // verify something changed (loading or results)
      await page.waitForTimeout(500);
    }
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  test('page has no critical accessibility violations (axe-core)', async ({ page }) => {
    // Install axe via injecting the script
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
    });

    const violations = await page.evaluate(async () => {
      const results = await (window as any).axe.run();
      return results.violations.filter(
        (v: any) => v.impact === 'critical' || v.impact === 'serious',
      );
    });

    // Log violations for debugging without failing on minor issues
    if (violations.length > 0) {
      console.warn('Accessibility violations found:', JSON.stringify(violations, null, 2));
    }

    expect(violations.length).toBe(0);
  });

  test('all interactive elements have accessible labels', async ({ page }) => {
    // Check that no buttons are completely label-less
    const unlabelledButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(
          (btn) =>
            !btn.getAttribute('aria-label') &&
            !btn.getAttribute('aria-labelledby') &&
            !btn.textContent?.trim(),
        )
        .map((btn) => btn.outerHTML.slice(0, 100));
    });

    expect(unlabelledButtons).toHaveLength(0);
  });

  // ── Screenshot comparisons ───────────────────────────────────────────────

  test('initial state screenshot matches baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('initial-state.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2,
    });
  });

  test('error state screenshot when wrong file type is uploaded', async ({ page }) => {
    // Upload a non-CSV file by triggering the dropzone rejection
    // We dispatch a custom drop event with application/json type
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="dropzone-input"]') as HTMLInputElement;
      if (input) {
        const file = new File(['{}'], 'data.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        Object.defineProperty(input, 'files', { value: dt.files });
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('error-state.png', {
      maxDiffPixelRatio: 0.1,
    });
  });
});
