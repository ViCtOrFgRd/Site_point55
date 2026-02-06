require('dotenv').config();
const nodemailer = require('nodemailer');

async function enviarEmailTeste() {
  console.log('\n📧 Enviando email de teste...\n');

  try {
    // Configurar transporter com Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verificar conexão
    await transporter.verify();
    console.log('✅ Servidor de email conectado com sucesso!\n');

    // Conteúdo do email
    const mailOptions = {
      from: `"Point55 - E-commerce" <${process.env.EMAIL_USER}>`,
      to: 'victorfiigueiredo@gmail.com',
      subject: '✅ Teste de Email - Sistema Point55',
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
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
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
            .info-box {
              background: #f0f9ff;
              border-left: 4px solid #3b82f6;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .info-box h3 {
              color: #1e40af;
              margin: 0 0 10px;
              font-size: 18px;
            }
            .info-box ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .info-box li {
              color: #1e40af;
              margin-bottom: 8px;
            }
            .success-badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
              margin: 10px 0;
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
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Point55</h1>
              <p style="margin: 10px 0 0; opacity: 0.95;">Sistema de E-commerce</p>
            </div>
            
            <div class="content">
              <h2>Email de Teste Enviado com Sucesso!</h2>
              
              <div class="success-badge">✅ Sistema Funcionando</div>
              
              <p>
                Olá <strong>Victor</strong>,
              </p>
              
              <p>
                Este é um email de teste do sistema Point55. Se você está recebendo esta mensagem, 
                significa que o sistema de envio de emails está configurado e funcionando corretamente! 🚀
              </p>
              
              <div class="info-box">
                <h3>📋 Funcionalidades Implementadas:</h3>
                <ul>
                  <li>✅ Sistema de recuperação de senha</li>
                  <li>✅ Sistema de favoritos de produtos</li>
                  <li>✅ Envio automático de emails</li>
                  <li>✅ 10 páginas institucionais completas</li>
                  <li>✅ Backend com API RESTful</li>
                  <li>✅ Frontend Next.js responsivo</li>
                </ul>
              </div>
              
              <div class="info-box">
                <h3>📧 Configurações de Email:</h3>
                <ul>
                  <li><strong>Servidor:</strong> Gmail SMTP</li>
                  <li><strong>Remetente:</strong> atendimento.sacpoint@gmail.com</li>
                  <li><strong>Status:</strong> Conectado e Operacional</li>
                  <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
                </ul>
              </div>
              
              <p>
                O sistema está pronto para enviar emails de recuperação de senha, confirmação 
                de pedidos, notificações e muito mais!
              </p>
              
              <center>
                <a href="http://localhost:3000" class="btn">
                  Acessar Sistema Point55
                </a>
              </center>
            </div>
            
            <div class="footer">
              <p><strong>Point55 - E-commerce de Roupas</strong></p>
              <p>WhatsApp: (11) 99338-5579</p>
              <p>Email: contato@point55.com.br</p>
              <p style="margin-top: 15px; font-size: 12px;">
                Este é um email automático de teste. Não responda esta mensagem.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso!');
    console.log(`📧 Para: ${mailOptions.to}`);
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`\n🎉 Verifique sua caixa de entrada: victorfiigueiredo@gmail.com\n`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Erro de autenticação. Verifique as credenciais no arquivo .env');
    }
  }
}

enviarEmailTeste();
