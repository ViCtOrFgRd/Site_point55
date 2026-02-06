import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  // Locators
  private readonly loginEmailInput = 'input[name="email"], input[type="email"]';
  private readonly loginPasswordInput = 'input[name="password"], input[type="password"]';
  private readonly loginButton = 'button:has-text("Entrar"), button:has-text("Login")';
  
  private readonly registerNomeInput = 'input[name="nome"]';
  private readonly registerEmailInput = 'input[name="email"]';
  private readonly registerCpfInput = 'input[name="cpf"]';
  private readonly registerTelefoneInput = 'input[name="telefone"]';
  private readonly registerPasswordInput = 'input[name="senha"], input[name="password"]';
  private readonly registerConfirmPasswordInput = 'input[name="confirmar_senha"], input[name="confirmPassword"]';
  private readonly registerButton = 'button:has-text("Cadastrar"), button:has-text("Criar conta")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToLogin() {
    await this.navigate('/login');
  }

  async navigateToRegister() {
    await this.navigate('/registro');
  }

  async login(email: string, password: string) {
    await this.fillInput(this.loginEmailInput, email);
    await this.fillInput(this.loginPasswordInput, password);
    await this.clickElement(this.loginButton);
    await this.waitForNavigation();
  }

  async register(userData: {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    senha: string;
  }) {
    await this.fillInput(this.registerNomeInput, userData.nome);
    await this.fillInput(this.registerEmailInput, userData.email);
    await this.fillInput(this.registerCpfInput, userData.cpf);
    await this.fillInput(this.registerTelefoneInput, userData.telefone);
    await this.fillInput(this.registerPasswordInput, userData.senha);
    await this.fillInput(this.registerConfirmPasswordInput, userData.senha);
    
    // Aguardar botão estar completamente estável
    await this.page.waitForTimeout(500);
    await this.page.locator(this.registerButton).click({ force: true });
    await this.waitForNavigation();
  }

  async verifyLoginSuccess() {
    // Aguarda redirecionamento (pode levar alguns segundos)
    await this.page.waitForURL(/\/(perfil|produtos|\/?$)/, { timeout: 15000 }).catch(() => {});
    
    // Verifica se foi redirecionado OU se há indicação de login
    const url = await this.getCurrentUrl();
    const isRedirected = url.match(/\/(perfil|produtos|\/?$)/);
    
    if (!isRedirected) {
      // Se não redirecionou, verifica se há token no localStorage
      const hasToken = await this.page.evaluate(() => !!localStorage.getItem('token'));
      expect(hasToken).toBeTruthy();
    }
  }

  async verifyRegisterSuccess() {
    // Aguarda redirecionamento ou verifica token
    await this.page.waitForURL(/\/(perfil|\/?)$/, { timeout: 10000 }).catch(() => {});
    
    const url = await this.getCurrentUrl();
    const isRedirected = !url.includes('/registro');
    
    if (!isRedirected) {
      // Se não redirecionou, aguarda o AuthContext processar e salvar o token
      await this.page.waitForTimeout(1000);
      const hasToken = await this.page.evaluate(() => !!localStorage.getItem('token'));
      expect(hasToken).toBeTruthy();
    }
  }

  async verifyLoginError(message?: string) {
    // Seletor mais específico para evitar conflito com Next.js route announcer
    const errorLocator = this.page.locator('.error, .alert-danger').or(
      this.page.locator('[role="alert"]').filter({ hasNotText: '' })
    ).first();
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
    
    if (message) {
      await expect(errorLocator).toContainText(message);
    }
  }

  async logout() {
    // Procurar por botão com ícone de logout ou texto "Sair"
    const logoutButton = this.page.locator('button:has-text("Sair"), a:has-text("Sair"), button[title="Sair"]').first();
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();
    
    // Aguardar o redirecionamento para /login ou limpeza do localStorage
    await this.page.waitForTimeout(2000);
    
    // Verificar se foi redirecionado para login
    const currentUrl = this.page.url();
    const isOnLoginPage = currentUrl.includes('/login');
    if (isOnLoginPage) {
      return; // Logout bem-sucedido
    }
  }

  async isLoggedIn(): Promise<boolean> {
    // Se estiver na página de login, claramente não está logado
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/registro')) {
      return false;
    }
    
    // Verifica se há token no localStorage como indicação de login
    const hasToken = await this.page.evaluate(() => !!localStorage.getItem('token'));
    if (hasToken) return true;
    
    // Alternativa: verifica se há menu de usuário visível
    const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu, a:has-text("Meu Perfil")');
    return await userMenu.first().isVisible({ timeout: 2000 }).catch(() => false);
  }
}
