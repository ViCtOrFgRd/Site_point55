const nodemailer = require('nodemailer');

// Configurar transporter do Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'atendimento.sacpoint@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'eqpp gdlv aiar qbeg'
  }
});

// Verificar conexão
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erro na configuração de email:', error);
  } else {
    console.log('✅ Servidor de email pronto para enviar mensagens');
  }
});

/**
 * Enviar email de recuperação de senha
 */
const enviarEmailRecuperacaoSenha = async (destinatario, token) => {
  const linkRecuperacao = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/nova-senha?token=${token}`;
  
  const mailOptions = {
    from: {
      name: 'Point55',
      address: process.env.EMAIL_USER || 'atendimento.sacpoint@gmail.com'
    },
    to: destinatario,
    subject: 'Recuperação de Senha - Point55',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; color: #78350f; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta Point55.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <center>
              <a href="${linkRecuperacao}" class="button">Redefinir Senha</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #3b82f6;">${linkRecuperacao}</p>
            <div class="warning">
              <strong>⚠️ Atenção:</strong> Este link é válido por apenas <strong>1 hora</strong> por motivos de segurança.
            </div>
            <p><strong>Se você não solicitou esta alteração, ignore este email.</strong> Sua senha permanecerá a mesma.</p>
          </div>
          <div class="footer">
            <p>Point55 - Seu Estilo, Nossa Paixão</p>
            <p>Este é um email automático, não responda.</p>
            <p>Dúvidas? Entre em contato: (11) 99338-5579</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperação enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
};

/**
 * Enviar email de confirmação de pedido
 */
const enviarEmailConfirmacaoPedido = async (destinatario, pedido) => {
  const mailOptions = {
    from: {
      name: 'Point55',
      address: process.env.EMAIL_USER || 'atendimento.sacpoint@gmail.com'
    },
    to: destinatario,
    subject: `Pedido #${pedido.id} Confirmado - Point55`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .pedido-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pedido Confirmado!</h1>
          </div>
          <div class="content">
            <p>Olá, ${pedido.nome}!</p>
            <p>Seu pedido foi confirmado com sucesso!</p>
            <div class="pedido-info">
              <h3>Pedido #${pedido.id}</h3>
              <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
              <p><strong>Status:</strong> ${pedido.status}</p>
            </div>
            <p>Você receberá atualizações sobre o status do seu pedido por email e SMS.</p>
            <p>Acompanhe seu pedido em: <a href="${process.env.FRONTEND_URL}/rastreio">Rastreamento</a></p>
          </div>
          <div class="footer">
            <p>Point55 - Seu Estilo, Nossa Paixão</p>
            <p>Dúvidas? WhatsApp: (11) 99338-5579</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmação enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
};

/**
 * Enviar email de boas-vindas
 */
const enviarEmailBoasVindas = async (destinatario, nome) => {
  const mailOptions = {
    from: {
      name: 'Point55',
      address: process.env.EMAIL_USER || 'atendimento.sacpoint@gmail.com'
    },
    to: destinatario,
    subject: 'Bem-vindo a Point55',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo a Point55!</h1>
          </div>
          <div class="content">
            <p>Ola, ${nome || 'cliente'}!</p>
            <p>Sua conta foi criada com sucesso. Agora voce pode acompanhar pedidos, salvar enderecos e aproveitar nossas ofertas.</p>
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/perfil" class="button">Acessar Minha Conta</a>
            </center>
            <p>Se precisar de ajuda, fale com a gente pelo WhatsApp: (11) 99338-5579</p>
          </div>
          <div class="footer">
            <p>Point55 - Seu Estilo, Nossa Paixao</p>
            <p>Este e um email automatico, nao responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de boas-vindas enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
};

/**
 * Enviar email genérico
 */
const enviarEmail = async (destinatario, assunto, html) => {
  const mailOptions = {
    from: {
      name: 'Point55',
      address: process.env.EMAIL_USER || 'atendimento.sacpoint@gmail.com'
    },
    to: destinatario,
    subject: assunto,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
};

module.exports = {
  enviarEmailRecuperacaoSenha,
  enviarEmailConfirmacaoPedido,
  enviarEmail,
  enviarEmailBoasVindas
};
