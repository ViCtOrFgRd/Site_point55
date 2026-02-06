import { test, expect } from '@playwright/test';
import { testData } from './helpers/test-data';
import { BasePage } from './helpers/page-objects/BasePage';

test.describe('Testes Básicos de Configuração', () => {
  test('Playwright está configurado corretamente', async ({ page }) => {
    // Testa navegação para página de exemplo
    await page.goto('https://playwright.dev');
    
    // Verifica que a página carregou
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('TypeScript está funcionando', async () => {
    // Testa tipos TypeScript
    const numbers: number[] = [1, 2, 3];
    const sum = numbers.reduce((a, b) => a + b, 0);
    
    expect(sum).toBe(6);
  });

  test('Imports de dados de teste estão funcionando', async () => {
    expect(testData).toBeDefined();
    expect(testData.users).toBeDefined();
    expect(testData.users.valid).toBeDefined();
    expect(testData.users.valid.nome).toBe('Teste Usuario');
  });

  test('Page Objects estão funcionando', async ({ page }) => {
    const basePage = new BasePage(page);
    expect(basePage).toBeDefined();
    
    // Testa método da BasePage
    await basePage.navigate('/');
    const url = await basePage.getCurrentUrl();
    expect(url).toContain('://');
  });
});
