import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  // Locators - Endereço
  private readonly cepInput = 'input[name="cep"]';
  private readonly logradouroInput = 'input[name="logradouro"]';
  private readonly numeroInput = 'input[name="numero"]';
  private readonly complementoInput = 'input[name="complemento"]';
  private readonly bairroInput = 'input[name="bairro"]';
  private readonly cidadeInput = 'input[name="cidade"]';
  private readonly estadoSelect = 'select[name="estado"]';
  
  // Locators - Pagamento
  private readonly creditCardOption = 'input[value="credito"], label:has-text("Cartão de Crédito")';
  private readonly pixOption = 'input[value="pix"], label:has-text("PIX")';
  private readonly boletoOption = 'input[value="boleto"], label:has-text("Boleto")';
  
  private readonly cardNumberInput = 'input[name="numero_cartao"], input[placeholder*="Número do cartão"]';
  private readonly cardNameInput = 'input[name="nome_cartao"], input[placeholder*="Nome no cartão"]';
  private readonly cardExpiryInput = 'input[name="validade"], input[placeholder*="Validade"]';
  private readonly cardCvvInput = 'input[name="cvv"], input[placeholder*="CVV"]';
  private readonly installmentsSelect = 'select[name="parcelas"]';
  
  // Locators - Finalização
  private readonly orderSummary = '[data-testid="order-summary"], .order-summary';
  private readonly finishOrderButton = 'button:has-text("Finalizar pedido"), button:has-text("Confirmar pagamento")';
  private readonly termsCheckbox = 'input[type="checkbox"][name="termos"]';

  constructor(page: Page) {
    super(page);
  }

  async navigateToCheckout() {
    await this.navigate('/checkout');
  }

  async fillAddress(address: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  }) {
    await this.fillInput(this.cepInput, address.cep);
    
    // Aguarda busca automática de CEP (se implementada)
    await this.page.waitForTimeout(1500);
    
    // Preenche campos manualmente se necessário
    if (await this.page.locator(this.logradouroInput).inputValue() === '') {
      await this.fillInput(this.logradouroInput, address.logradouro);
      await this.fillInput(this.bairroInput, address.bairro);
      await this.fillInput(this.cidadeInput, address.cidade);
      await this.page.selectOption(this.estadoSelect, address.estado);
    }
    
    await this.fillInput(this.numeroInput, address.numero);
    
    if (address.complemento) {
      await this.fillInput(this.complementoInput, address.complemento);
    }
  }

  async selectPaymentMethod(method: 'credito' | 'pix' | 'boleto') {
    switch (method) {
      case 'credito':
        await this.clickElement(this.creditCardOption);
        break;
      case 'pix':
        await this.clickElement(this.pixOption);
        break;
      case 'boleto':
        await this.clickElement(this.boletoOption);
        break;
    }
    
    await this.page.waitForTimeout(500);
  }

  async fillCreditCardInfo(card: {
    numero: string;
    nome: string;
    validade: string;
    cvv: string;
    parcelas?: string;
  }) {
    await this.fillInput(this.cardNumberInput, card.numero);
    await this.fillInput(this.cardNameInput, card.nome);
    await this.fillInput(this.cardExpiryInput, card.validade);
    await this.fillInput(this.cardCvvInput, card.cvv);
    
    if (card.parcelas) {
      await this.page.selectOption(this.installmentsSelect, card.parcelas);
    }
  }

  async acceptTerms() {
    const checkbox = this.page.locator(this.termsCheckbox);
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
  }

  async finishOrder() {
    await this.clickElement(this.finishOrderButton);
    await this.waitForNavigation();
  }

  async verifyOrderSummary() {
    await expect(this.page.locator(this.orderSummary)).toBeVisible();
  }

  async verifyOrderSuccess() {
    // Verifica se foi redirecionado para página de sucesso
    const url = await this.getCurrentUrl();
    expect(url).toMatch(/\/(pedidos|sucesso|confirmacao)/);
    
    // Verifica mensagem de sucesso
    const successMessage = this.page.locator('h1:has-text("Pedido realizado"), h2:has-text("sucesso")');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  }

  async getOrderNumber(): Promise<string | null> {
    const orderNumberElement = this.page.locator('[data-testid="order-number"], .order-number');
    
    if (await orderNumberElement.isVisible()) {
      const text = await orderNumberElement.textContent();
      const match = text?.match(/\d+/);
      return match ? match[0] : null;
    }
    
    return null;
  }

  async verifyPixQRCode() {
    const qrCode = this.page.locator('[data-testid="pix-qrcode"], .pix-qrcode, img[alt*="QR Code"]');
    await expect(qrCode).toBeVisible({ timeout: 5000 });
  }

  async verifyBoletoLink() {
    const boletoLink = this.page.locator('a:has-text("Visualizar boleto"), a:has-text("Baixar boleto")');
    await expect(boletoLink).toBeVisible({ timeout: 5000 });
  }
}
