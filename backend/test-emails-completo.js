require('dotenv').config();
const nodemailer = require('nodemailer');

const testRecipient = process.env.TEST_RECIPIENT_EMAIL || 'user@example.com';
const testRecipientName = process.env.TEST_RECIPIENT_NAME || 'Usuario Teste';

async function testarRecuperacaoSenha() {
  console.log('\n🔐 Teste de Recuperação de Senha');
  console.log('============================================================\n');

  try {
    // Configurar transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.verify();
    console.log('✅ Servidor de email conectado\n');

    // Simular token de recuperação
    const token = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567';
    const email = testRecipient;
    const nome = testRecipientName;

    // Conteúdo do email de recuperação
    const mailOptions = {
      from: `"Point55 - Recuperação de Senha" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔒 Recuperação de Senha - Point55',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
            }
            .lock-icon {
              font-size: 64px;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #1f2937;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .content p {
              color: #4b5563;
              font-size: 16px;
              line-height: 1.8;
              margin-bottom: 16px;
            }
            .alert-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .alert-box p {
              color: #78350f;
              margin: 0;
              font-weight: 500;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .token-box {
              background: #f3f4f6;
              border: 2px dashed #9ca3af;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .token-box code {
              font-size: 14px;
              color: #1f2937;
              word-break: break-all;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280;
              font-size: 14px;
              margin: 5px 0;
            }
            .security-tips {
              background: #f0f9ff;
              border-left: 4px solid #3b82f6;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .security-tips h3 {
              color: #1e40af;
              margin: 0 0 10px;
              font-size: 18px;
            }
            .security-tips ul {
              margin: 10px 0 0;
              padding-left: 20px;
            }
            .security-tips li {
              color: #1e40af;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="lock-icon">🔒</div>
              <h1>Point55</h1>
              <p style="margin: 10px 0 0; opacity: 0.95;">Recuperação de Senha</p>
            </div>
            
            <div class="content">
              <h2>Redefinir sua senha</h2>
              
              <p>
                Olá <strong>${nome}</strong>,
              </p>
              
              <p>
                Recebemos uma solicitação para redefinir a senha da sua conta Point55. 
                Se você não fez esta solicitação, pode ignorar este email com segurança.
              </p>
              
              <p>
                Para criar uma nova senha, clique no botão abaixo. Este link é válido 
                por <strong>1 hora</strong> por motivos de segurança.
              </p>
              
              <center>
                <a href="http://localhost:3000/nova-senha?token=${token}" class="btn">
                  Redefinir Minha Senha
                </a>
              </center>
              
              <div class="alert-box">
                <p>⏰ Este link expira em 1 hora (${new Date(Date.now() + 3600000).toLocaleString('pt-BR')})</p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              
              <div class="token-box">
                <code>http://localhost:3000/nova-senha?token=${token}</code>
              </div>
              
              <div class="security-tips">
                <h3>🛡️ Dicas de Segurança:</h3>
                <ul>
                  <li>Use uma senha forte com pelo menos 8 caracteres</li>
                  <li>Combine letras maiúsculas, minúsculas, números e símbolos</li>
                  <li>Não reutilize senhas de outros sites</li>
                  <li>Nunca compartilhe sua senha com ninguém</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Point55 - E-commerce de Roupas</strong></p>
              <p>WhatsApp: (11) 99338-5579</p>
              <p>Email: atendimento.sacpoint@gmail.com</p>
              <p style="margin-top: 15px; font-size: 12px;">
                Este é um email automático. Se você não solicitou a recuperação de senha, 
                entre em contato conosco imediatamente.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de recuperação enviado!');
    console.log(`📧 Para: ${email}`);
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    console.log(`⏰ Expira em: 1 hora\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function testarEmailPromocao() {
  console.log('\n🎉 Teste de Email Promocional');
  console.log('============================================================\n');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.verify();
    console.log('✅ Servidor de email conectado\n');

    const email = testRecipient;
    const nome = testRecipientName;

    // Produtos em promoção (exemplo)
    const produtos = [
      {
        nome: 'Camiseta Básica Premium',
        preco_original: 89.90,
        preco_promocional: 49.90,
        desconto: 44,
        imagem: 'https://via.placeholder.com/300x400/3b82f6/ffffff?text=Camiseta'
      },
      {
        nome: 'Calça Jeans Skinny',
        preco_original: 159.90,
        preco_promocional: 99.90,
        desconto: 38,
        imagem: 'https://via.placeholder.com/300x400/10b981/ffffff?text=Calça'
      },
      {
        nome: 'Vestido Floral Verão',
        preco_original: 199.90,
        preco_promocional: 119.90,
        desconto: 40,
        imagem: 'https://via.placeholder.com/300x400/ec4899/ffffff?text=Vestido'
      }
    ];

    const mailOptions = {
      from: `"Point55 - Promoções" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔥 SUPER PROMOÇÃO - Até 50% OFF em Produtos Selecionados!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 650px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 50px 30px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '🔥';
              font-size: 80px;
              position: absolute;
              top: -10px;
              left: 50%;
              transform: translateX(-50%);
              animation: fire 1s ease-in-out infinite;
            }
            @keyframes fire {
              0%, 100% { transform: translateX(-50%) translateY(0); }
              50% { transform: translateX(-50%) translateY(-10px); }
            }
            .header h1 {
              margin: 40px 0 10px;
              font-size: 42px;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 20px;
              opacity: 0.95;
            }
            .promo-badge {
              background: #fef3c7;
              color: #92400e;
              padding: 15px 30px;
              text-align: center;
              font-size: 18px;
              font-weight: 700;
              border-bottom: 3px solid #f59e0b;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .greeting strong {
              color: #ef4444;
            }
            .products {
              display: grid;
              gap: 25px;
              margin: 30px 0;
            }
            .product {
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
              transition: transform 0.2s;
            }
            .product:hover {
              transform: translateY(-5px);
              box-shadow: 0 8px 20px rgba(0,0,0,0.1);
            }
            .product-image {
              width: 100%;
              height: 300px;
              object-fit: cover;
              background: #f3f4f6;
            }
            .product-info {
              padding: 20px;
            }
            .product-name {
              font-size: 20px;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 10px;
            }
            .product-prices {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 15px;
            }
            .price-original {
              font-size: 16px;
              color: #9ca3af;
              text-decoration: line-through;
            }
            .price-promo {
              font-size: 28px;
              font-weight: 700;
              color: #10b981;
            }
            .discount-badge {
              background: #ef4444;
              color: white;
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 700;
            }
            .btn-product {
              display: block;
              width: 100%;
              background: linear-gradient(135deg, #000 0%, #1f2937 100%);
              color: white;
              text-decoration: none;
              padding: 12px;
              border-radius: 8px;
              text-align: center;
              font-weight: 600;
            }
            .cta-section {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 30px;
              text-align: center;
              margin: 30px 0;
              border-radius: 12px;
            }
            .cta-section h2 {
              color: #1f2937;
              margin: 0 0 15px;
            }
            .btn-cta {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              text-decoration: none;
              padding: 18px 50px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 18px;
              margin-top: 10px;
            }
            .conditions {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .conditions p {
              color: #78350f;
              margin: 5px 0;
              font-size: 14px;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280;
              font-size: 14px;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SUPER PROMOÇÃO</h1>
              <p>Descontos Imperdíveis!</p>
            </div>
            
            <div class="promo-badge">
              ⏰ Promoção válida até 10/02/2026 às 23:59h
            </div>
            
            <div class="content">
              <div class="greeting">
                Olá <strong>${nome}</strong>! 👋
                <p style="margin: 15px 0; color: #4b5563; font-size: 16px;">
                  Preparamos ofertas especiais só para você! Aproveite até <strong>50% OFF</strong> 
                  em produtos selecionados com frete grátis para compras acima de R$ 299.
                </p>
              </div>
              
              <div class="products">
                ${produtos.map(produto => `
                  <div class="product">
                    <img src="${produto.imagem}" alt="${produto.nome}" class="product-image">
                    <div class="product-info">
                      <h3 class="product-name">${produto.nome}</h3>
                      <div class="product-prices">
                        <span class="price-original">R$ ${produto.preco_original.toFixed(2)}</span>
                        <span class="price-promo">R$ ${produto.preco_promocional.toFixed(2)}</span>
                        <span class="discount-badge">${produto.desconto}% OFF</span>
                      </div>
                      <a href="http://localhost:3000/produtos" class="btn-product">
                        🛒 Comprar Agora
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="cta-section">
                <h2>🎁 Ainda tem mais!</h2>
                <p style="margin: 10px 0; color: #4b5563; font-size: 16px;">
                  Explore nossa coleção completa e encontre muito mais ofertas
                </p>
                <a href="http://localhost:3000/promocoes" class="btn-cta">
                  Ver Todas as Promoções
                </a>
              </div>
              
              <div class="conditions">
                <p><strong>📋 Condições:</strong></p>
                <p>• Promoção válida até 10/02/2026 ou enquanto durarem os estoques</p>
                <p>• Frete grátis para compras acima de R$ 299</p>
                <p>• Não cumulativo com outras promoções</p>
                <p>• Produtos sujeitos à disponibilidade de estoque</p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Point55 - E-commerce de Roupas</strong></p>
              <p>📱 WhatsApp: (11) 99338-5579</p>
              <p>📧 Email: atendimento.sacpoint@gmail.com</p>
              <p style="margin-top: 15px; font-size: 12px;">
                Você está recebendo este email porque se cadastrou em nosso site.
                <br><a href="#" style="color: #3b82f6;">Cancelar inscrição</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email promocional enviado!');
    console.log(`📧 Para: ${email}`);
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`🏷️  Produtos em promoção: ${produtos.length}`);
    console.log(`💰 Economia total: R$ ${produtos.reduce((acc, p) => acc + (p.preco_original - p.preco_promocional), 0).toFixed(2)}\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function executarTestes() {
  console.log('\n🧪 Teste de Emails - Point55');
  console.log('============================================================');
  
  await testarRecuperacaoSenha();
  await testarEmailPromocao();
  
  console.log('\n============================================================');
  console.log('🎉 Testes de email concluídos!');
  console.log(`📬 Verifique sua caixa de entrada: ${testRecipient}`);
  console.log('============================================================\n');
}

executarTestes();
