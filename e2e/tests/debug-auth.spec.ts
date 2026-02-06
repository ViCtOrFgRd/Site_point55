import { test, expect } from '@playwright/test';
import { AuthPage } from './helpers/page-objects/AuthPage';
import { testData } from './helpers/test-data';

test.describe('Debug - Verificar estado após login', () => {
  test('verificar localStorage e botão de logout', async ({ page }) => {
    // Limpar estado
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const authPage = new AuthPage(page);
    
    // Fazer login
    await authPage.navigateToLogin();
    await authPage.login(testData.users.admin.email, testData.users.admin.senha);
    
    // Aguardar redirecionamento
    await page.waitForTimeout(3000);
    
    // Verificar localStorage
    const storageData = await page.evaluate(() => ({
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
    }));
    
    console.log('📦 localStorage após login:', storageData);
    
    // Verificar se user está parseável
    if (storageData.user) {
      try {
        const user = JSON.parse(storageData.user);
        console.log('👤 User object:', user);
      } catch (e) {
        console.error('❌ Erro ao parsear user:', e);
      }
    }
    
    // Procurar todos os botões e links no header
    const headerButtons = await page.locator('header button, header a').allTextContents();
    console.log('🔘 Botões no header:', headerButtons);
    
    // Verificar estado do React (se possível)
    const hasUserInContext = await page.evaluate(() => {
      // Tentar acessar o contexto React via window (hack)
      return {
        hasLocalStorageUser: !!localStorage.getItem('user'),
        hasLocalStorageToken: !!localStorage.getItem('token'),
      };
    });
    console.log('🔍 Estado:', hasUserInContext);
    
    // Aguardar mais tempo para o AuthProvider processar
    await page.waitForTimeout(5000);
    
    // Verificar novamente após espera
    const logoutButtonAfterWait = await page.locator('button[title="Sair"]').count();
    console.log(`🚪 Botão de logout após 5s: ${logoutButtonAfterWait > 0}`);
    
    // Verificar se há algum botão com ícone (mesmo sem texto)
    const allButtons = await page.locator('button').count();
    console.log(`🔢 Total de botões na página: ${allButtons}`);
    
    // Tirar screenshot para análise
    await page.screenshot({ path: 'test-results/debug-after-login.png', fullPage: true });
    
    // Verificar se o botão existe (mesmo que não visível)
    const logoutButtonExists = await page.locator('button[title="Sair"]').count();
    console.log(`🚪 Botão de logout existe: ${logoutButtonExists > 0}`);
    
    // Verificar o HTML do header
    const headerHTML = await page.locator('header').innerHTML();
    console.log('📄 Header HTML (primeiros 500 chars):', headerHTML.substring(0, 500));
    
    expect(storageData.token).toBeTruthy();
    expect(storageData.user).toBeTruthy();
  });
});
