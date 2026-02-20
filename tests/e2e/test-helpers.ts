/* eslint-disable @typescript-eslint/no-explicit-any */
import { Page, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

/**
 * Test Helpers - Reusable utilities for E2E tests
 */

/**
 * Wait for page to be fully loaded and interactive
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigate to a page and wait for it to be ready
 */
export async function navigateAndReady(
  page: Page,
  url: string,
  timeout: number = 10000
): Promise<void> {
  await Promise.race([
    page.goto(url),
    page.waitForURL(url, { timeout })
  ]);
  await waitForPageReady(page);
}

/**
 * Find and click a button by text content
 */
export async function clickButton(
  page: Page,
  buttonText: string | RegExp,
  options: { exact?: boolean } = {}
): Promise<void> {
  const button = page.getByRole('button', { name: buttonText, exact: options.exact });
  await button.waitFor({ state: 'visible', timeout: 5000 });
  await button.click();
}

/**
 * Find and click a link by text content
 */
export async function clickLink(
  page: Page,
  linkText: string | RegExp,
  options: { exact?: boolean } = {}
): Promise<void> {
  const link = page.getByRole('link', { name: linkText, exact: options.exact });
  await link.waitFor({ state: 'visible', timeout: 5000 });
  await link.click();
}

/**
 * Fill a form field by name, placeholder, or label
 */
export async function fillField(
  page: Page,
  identifier: string,
  value: string
): Promise<void> {
  // Try multiple selectors
  const selectors = [
    `input[name="${identifier}"]`,
    `textarea[name="${identifier}"]`,
    `input[placeholder*="${identifier.toLowerCase()}"]`,
    `textarea[placeholder*="${identifier.toLowerCase()}"]`,
    `label:has-text("${identifier}") >> input`,
    `label:has-text("${identifier}") >> textarea`,
    `[aria-label*="${identifier}"]`
  ];

  let field;
  for (const selector of selectors) {
    try {
      field = page.locator(selector).first();
      await field.waitFor({ state: 'visible', timeout: 2000 });
      break;
    } catch (e) {
      // Try next selector
    }
  }

  if (field) {
    await field.fill(value);
  } else {
    throw new Error(`Could not find field with identifier: ${identifier}`);
  }
}

/**
 * Fill multiple form fields
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [key, value] of Object.entries(fields)) {
    await fillField(page, key, value);
  }
}

/**
 * Submit a form
 */
export async function submitForm(
  page: Page,
  submitText: string = 'Submit'
): Promise<void> {
  const submitButton = page.getByRole('button', { name: submitText }).or(
    page.locator('input[type="submit"]')
  );
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  await submitButton.click();
}

/**
 * Verify success message is displayed
 */
export async function verifySuccessMessage(
  page: Page,
  message: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  const successLocator = page.getByText(message).or(
    page.locator('[role="status"] >> text', { hasText: message })
  );
  await expect(successLocator.first()).toBeVisible({ timeout });
}

/**
 * Verify error message is displayed
 */
export async function verifyErrorMessage(
  page: Page,
  message: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  const errorLocator = page.getByText(message).or(
    page.locator('[role="alert"] >> text', { hasText: message })
  );
  await expect(errorLocator.first()).toBeVisible({ timeout });
}

/**
 * Take a screenshot with a descriptive filename
 */
export async function takeScreenshot(
  page: Page,
  testName: string,
  step: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName}-${step}-${timestamp}.png`;
  await page.screenshot({ path: `test-results/screenshots/${filename}` });
}

/**
 * Navigate to group ranking page
 */
export async function goToGroupRanking(page: Page, groupSlug: string = 'padel'): Promise<void> {
  await navigateAndReady(page, `/g/${groupSlug}/ranking`);
}

/**
 * Navigate to group venues page
 */
export async function goToGroupVenues(page: Page, groupSlug: string = 'padel'): Promise<void> {
  await navigateAndReady(page, `/g/${groupSlug}/venues`);
}

/**
 * Navigate to group challenges page
 */
export async function goToGroupChallenges(page: Page, groupSlug: string = 'padel'): Promise<void> {
  await navigateAndReady(page, `/g/${groupSlug}/challenges`);
}

/**
 * Navigate to group matches page
 */
export async function goToGroupMatches(page: Page, groupSlug: string = 'padel'): Promise<void> {
  await navigateAndReady(page, `/g/${groupSlug}/matches`);
}

/**
 * Navigate to group events page
 */
export async function goToGroupEvents(page: Page, groupSlug: string = 'padel'): Promise<void> {
  await navigateAndReady(page, `/g/${groupSlug}/events`);
}

/**
 * Get text content from element with fallback
 */
export async function getTextContent(
  page: Page,
  selector: string,
  fallback: string = ''
): Promise<string> {
  const element = page.locator(selector).first();
  if (await element.isVisible().catch(() => false)) {
    return await element.innerText();
  }
  return fallback;
}

/**
 * Count elements by selector
 */
export async function countElements(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}

/**
 * Verify URL matches pattern
 */
export async function verifyURL(
  page: Page,
  pattern: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Wait for modal/dialog to appear
 */
export async function waitForModal(page: Page, timeout: number = 5000): Promise<void> {
  const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
  await modal.waitFor({ state: 'visible', timeout });
}

/**
 * Close modal/dialog
 */
export async function closeModal(page: Page): Promise<void> {
  const closeButton = page.locator('[aria-label="Close"], [aria-label="Cerrar"], button:has-text("X"), button:has-text("×")').first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}

/**
 * Select option from dropdown
 */
export async function selectDropdownOption(
  page: Page,
  selector: string,
  optionText: string
): Promise<void> {
  const dropdown = page.locator(selector).first();
  await dropdown.selectOption({ label: optionText });
}

/**
 * Upload file
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
): Promise<void> {
  const fileInput = page.locator(selector).first();
  await fileInput.setInputFiles(filePath);
}

/**
 * Hover over element
 */
export async function hoverOverElement(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector).first();
  await element.hover();
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
}

/**
 * Wait for element to be visible
 */
export async function waitForElementVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  const element = page.locator(selector).first();
  await element.waitFor({ state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementHidden(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  const element = page.locator(selector).first();
  await element.waitFor({ state: 'hidden', timeout });
}

/**
 * Get page performance metrics
 */
export async function getPerformanceMetrics(page: Page): Promise<any> {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart
    };
  });
  return metrics;
}

/**
 * Check if element exists in DOM
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const count = await page.locator(selector).count();
    return count > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Get all text content from a selector
 */
export async function getAllTextContents(
  page: Page,
  selector: string
): Promise<string[]> {
  return await page.locator(selector).allTextContents();
}

/**
 * Verify element has specific class
 */
export async function verifyHasClass(
  page: Page,
  selector: string,
  className: string
): Promise<void> {
  const element = page.locator(selector).first();
  await expect(element).toHaveClass(new RegExp(className));
}

/**
 * Verify element has specific attribute
 */
export async function verifyHasAttribute(
  page: Page,
  selector: string,
  attribute: string,
  value?: string
): Promise<void> {
  const element = page.locator(selector).first();
  if (value) {
    await expect(element).toHaveAttribute(attribute, value);
  } else {
    const attrValue = await element.getAttribute(attribute);
    expect(attrValue).toBeTruthy();
  }
}

/**
 * Wait for API request to complete
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 30000
): Promise<any> {
  const responsePromise = page.waitForResponse(
    response => !!response.url().match(urlPattern),
    { timeout }
  );
  const response = await responsePromise;
  return response.json().catch(() => response.text());
}

/**
 * Intercept and mock API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  mockData: any
): Promise<void> {
  await page.route(urlPattern, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });
}

/**
 * Get current user info (if logged in)
 */
export async function getCurrentUser(page: Page): Promise<{ name: string; id?: string } | null> {
  // Try to find user name in common locations
  const selectors = [
    '[data-testid="user-name"]',
    '.user-name',
    '[aria-label*="user"]',
    'button:has-text("Cerrar sesión")' // Click to find parent with user info
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const text = await element.innerText();
        if (text) {
          return { name: text };
        }
      }
    } catch (e) {
      // Try next selector
    }
  }

  return null;
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), button:has-text("Salir")').first();
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await waitForPageReady(page);
  }
}

/**
 * Login user with passphrase
 */
export async function login(page: Page, groupSlug: string = 'padel', passphrase: string = 'padel'): Promise<void> {
  await navigateAndReady(page, `/g/${groupSlug}/join`);
  const passphraseInput = page.locator('input[type="password"], input[name="passphrase"]').first();
  const joinButton = page.locator('button:has-text("Ingresar"), button:has-text("Ingresá"), button:has-text("Join")').first();
  
  await passphraseInput.fill(passphrase);
  await joinButton.click();
  await page.waitForURL(/\/ranking/, { timeout: 5000 });
}
