import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async waitForSelector(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async verifyToast(message: string) {
    const toast = this.page.locator('.toast, .alert, [role="alert"]').filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout: 5000 });
  }

  async verifyErrorMessage(message: string) {
    // Seletor mais específico e flexível
    const error = this.page.locator('.error, .invalid-feedback').or(
      this.page.locator('[role="alert"]').filter({ hasNotText: '' })
    ).filter({ hasText: message }).first();
    await expect(error).toBeVisible({ timeout: 10000 });
  }
}
