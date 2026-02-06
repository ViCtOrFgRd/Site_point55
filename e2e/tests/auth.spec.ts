import { test, expect } from '@playwright/test';
import { AuthPage } from './helpers/page-objects/AuthPage';
import { testData, generateRandomEmail, generateRandomCPF } from './helpers/test-data';

test.describe('Autenticação de Usuário', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    // Limpar localStorage antes de cada teste
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    authPage = new AuthPage(page);
  });

  test('deve fazer login com credenciais válidas @smoke @critical', async () => {
    await authPage.navigateToLogin();
    await authPage.login(testData.users.admin.email, testData.users.admin.senha);
    await authPage.verifyLoginSuccess();
    expect(await authPage.isLoggedIn()).toBeTruthy();
  });

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    // Garantir que não há token de teste anterior
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await authPage.navigateToLogin();
    await authPage.login(testData.users.invalid.email, testData.users.invalid.senha);
    await authPage.verifyLoginError();
    
    // Verificar que realmente não há token
    const hasToken = await page.evaluate(() => !!localStorage.getItem('token'));
    expect(hasToken).toBeFalsy();
  });

  test('deve exibir erro com email não cadastrado', async () => {
    await authPage.navigateToLogin();
    await authPage.login('naoexiste@example.com', 'SenhaQualquer123!');
    await authPage.verifyLoginError();
  });

  test('deve exibir erro com senha incorreta', async () => {
    await authPage.navigateToLogin();
    await authPage.login(testData.users.admin.email, 'SenhaErrada123!');
    await authPage.verifyLoginError();
  });

  test('deve cadastrar novo usuário com sucesso @smoke', async () => {
    const newUser = {
      ...testData.users.valid,
      email: generateRandomEmail(),
      cpf: generateRandomCPF(),
    };

    await authPage.navigateToRegister();
    await authPage.register(newUser);
    await authPage.verifyRegisterSuccess();
  });

  test('deve exibir erro ao tentar cadastrar com email duplicado', async ({ page }) => {
    await authPage.navigateToRegister();
    
    // Preencher formulário manualmente para capturar erro sem navegar
    await page.fill('input[name="nome"]', testData.users.valid.nome);
    await page.fill('input[name="email"]', testData.users.admin.email);
    await page.fill('input[name="cpf"]', '99999999999');
    await page.fill('input[name="telefone"]', testData.users.valid.telefone);
    await page.fill('input[name="password"]', testData.users.valid.senha);
    await page.fill('input[name="confirmPassword"]', testData.users.valid.senha);
    
    // Clicar no botão e aguardar erro
    await page.click('button:has-text("Cadastrar")');
    
    // Aguardar mensagem de erro (com variações possíveis)
    await page.waitForSelector('[role="alert"], .error', { timeout: 5000 });
    const errorText = await page.locator('[role="alert"], .error').first().textContent();
    expect(errorText?.toLowerCase()).toContain('email');
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    await authPage.navigateToLogin();
    await authPage.login(testData.users.admin.email, testData.users.admin.senha);
    await authPage.verifyLoginSuccess();
    
    // Aguardar o AuthContext carregar o usuário
    await page.waitForTimeout(3000);
    
    await authPage.logout();
    
    // Aguardar redirecionamento para login
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});
    
    // Verificar que está na página de login
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Verificar que não há token
    const hasToken = await page.evaluate(() => !!localStorage.getItem('token'));
    expect(hasToken).toBeFalsy();
  });

  test('deve validar campos obrigatórios no registro', async ({ page }) => {
    await authPage.navigateToRegister();
    
    // Tenta enviar formulário vazio
    await page.click('button:has-text("Cadastrar")');
    
    // Verifica se há mensagens de validação
    const errors = page.locator('.error, .invalid-feedback, [role="alert"]');
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('deve validar formato de email', async ({ page }) => {
    await authPage.navigateToLogin();
    
    await page.fill('input[type="email"]', 'email-invalido');
    await page.click('button:has-text("Entrar")');
    
    const emailError = page.locator('input[type="email"]:invalid, .error:has-text("e-mail")');
    expect(await emailError.count()).toBeGreaterThan(0);
  });

  test('deve manter sessão após recarregar página', async ({ page, context }) => {
    await authPage.navigateToLogin();
    await authPage.login(testData.users.admin.email, testData.users.admin.senha);
    await authPage.verifyLoginSuccess();
    
    // Recarrega a página
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verifica se ainda está logado
    expect(await authPage.isLoggedIn()).toBeTruthy();
  });
});
