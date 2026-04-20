const nodemailer = require('nodemailer');
require('dotenv').config();

const emailUser = process.env.EMAIL_USER || 'no-reply@example.com';
const emailPassword = process.env.EMAIL_PASSWORD || '';
const testRecipient = process.env.TEST_RECIPIENT_EMAIL || 'user@example.com';

// Configurar transporter do Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});

async function testarEmailRecuperacao() {
  console.log('\n🧪 Teste de Email de Recuperação com Link Corrigido');
  console.log('============================================================\n');

  // Gerar token de teste
  const token = 'abc123def456ghi789jklmno' + Date.now();
  const linkRecuperacao = `http://localhost:3000/nova-senha?token=${token}`;

  const mailOptions = {
    from: {
      name: 'Point55',
      address: emailUser
    },
    to: testRecipient,
    subject: '🔐 Recuperação de Senha - Point55',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
          .header { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            padding: 50px 30px; 
            text-align: center; 
          }
          .header .icon { font-size: 60px; margin-bottom: 20px; }
          .header h1 { font-size: 28px; margin-bottom: 10px; font-weight: 700; }
          .header p { font-size: 16px; opacity: 0.95; }
          .content { padding: 40px 30px; }
          .content p { color: #4b5563; line-height: 1.8; margin-bottom: 20px; font-size: 15px; }
          .content strong { color: #1f2937; }
          .button-container { text-align: center; margin: 35px 0; }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white !important; 
            padding: 18px 50px; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 600; 
            font-size: 16px;
            box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
          }
          .button:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4); }
          .link-box { 
            background: #f9fafb; 
            border: 2px dashed #d1d5db; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            text-align: center;
          }
          .link-box p { 
            color: #6b7280; 
            font-size: 13px; 
            margin-bottom: 10px; 
          }
          .link-box a { 
            color: #dc2626; 
            word-break: break-all; 
            font-size: 14px;
            font-weight: 500;
          }
          .warning { 
            background: #fef2f2; 
            border-left: 4px solid #dc2626; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px; 
          }
          .warning strong { color: #991b1b; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
          .warning p { color: #7f1d1d; margin: 0; font-size: 14px; }
          .security-tips { 
            background: #f0fdf4; 
            border: 1px solid #bbf7d0; 
            padding: 25px; 
            border-radius: 12px; 
            margin: 30px 0; 
          }
          .security-tips h3 { color: #166534; margin-bottom: 15px; font-size: 16px; }
          .security-tips ul { padding-left: 20px; }
          .security-tips li { color: #15803d; margin-bottom: 8px; font-size: 14px; line-height: 1.6; }
          .footer { 
            background: #f9fafb; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer p { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
          .footer strong { color: #374151; }
          .footer .contact { 
            margin-top: 15px; 
            padding-top: 15px; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer .contact a { color: #dc2626; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔒</div>
            <h1>Recuperação de Senha</h1>
            <p>Solicitação de redefinição de senha</p>
          </div>
          
          <div class="content">
            <p>Olá!</p>
            <p>Recebemos uma solicitação para <strong>redefinir a senha</strong> da sua conta Point55.</p>
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            
            <div class="button-container">
              <a href="${linkRecuperacao}" class="button">Redefinir Minha Senha</a>
            </div>
            
            <div class="link-box">
              <p>Ou copie e cole este link no seu navegador:</p>
              <a href="${linkRecuperacao}">${linkRecuperacao}</a>
            </div>
            
            <div class="warning">
              <strong>⏰ Atenção - Link Temporário</strong>
              <p>Este link é válido por apenas <strong>1 hora</strong> por motivos de segurança. Após este período, será necessário solicitar um novo link.</p>
            </div>
            
            <div class="security-tips">
              <h3>🛡️ Dicas de Segurança para sua Nova Senha:</h3>
              <ul>
                <li>Use no mínimo 8 caracteres</li>
                <li>Combine letras maiúsculas e minúsculas</li>
                <li>Inclua números e caracteres especiais (!@#$%...)</li>
                <li>Evite usar informações pessoais óbvias</li>
                <li>Não reutilize senhas de outras contas</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;"><strong>⚠️ Importante:</strong> Se você <strong>não solicitou</strong> esta alteração, ignore este email. Sua senha permanecerá a mesma e sua conta está segura.</p>
          </div>
          
          <div class="footer">
            <p><strong>Point55</strong></p>
            <p>Seu Estilo, Nossa Paixão 🛍️</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">Este é um email automático, por favor não responda.</p>
            <div class="contact">
              <p>Precisa de ajuda? Entre em contato:</p>
              <p>📧 <a href="mailto:atendimento.sacpoint@gmail.com">atendimento.sacpoint@gmail.com</a></p>
              <p>📱 <strong>(11) 99338-5579</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('⏳ Verificando servidor de email...');
    await transporter.verify();
    console.log('✅ Servidor de email conectado\n');

    console.log('📤 Enviando email de recuperação...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso!');
    console.log(`📧 Para: ${testRecipient}`);
    console.log('📬 Message ID:', info.messageId);
    console.log('🔗 Link: http://localhost:3000/nova-senha?token=' + token.substring(0, 20) + '...');
    console.log('\n============================================================');
    console.log('✅ Teste concluído! Verifique seu email e teste o link.');
    console.log('============================================================\n');
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
  }
}

testarEmailRecuperacao();
