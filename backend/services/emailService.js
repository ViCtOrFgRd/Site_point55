const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || 'atendimento.sacpoint@gmail.com';
const emailPassword = process.env.EMAIL_PASSWORD || '';
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = Number(process.env.EMAIL_PORT || 587);
const emailSecure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || emailPort === 465;
const emailRejectUnauthorized = String(process.env.EMAIL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
const emailHostIpv4 = process.env.EMAIL_HOST_IPV4 || '';

if (!emailPassword) {
  console.error('❌ EMAIL_PASSWORD não configurado. Emails não serão enviados.');
}

// Configurar transporter do Gmail
const transporter = nodemailer.createTransport({
  host: emailHostIpv4 || emailHost,
  port: emailPort,
  secure: emailSecure,
  requireTLS: !emailSecure,
  connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 20000),
  greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 15000),
  socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 30000),
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
  tls: {
    servername: emailHost,
    rejectUnauthorized: emailRejectUnauthorized,
  },
});

// Verificar conexão
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erro na configuração de email:', error);
    if (['EDNS', 'EAI_AGAIN', 'ENOTFOUND', 'ETIMEOUT'].includes(error.code)) {
      console.error('ℹ️ Falha de DNS detectada. Configure EMAIL_HOST_IPV4 no .env para forçar conexão sem consulta DNS.');
    }
  } else {
    console.info('✅ Servidor de email pronto para enviar mensagens');
    if (emailHostIpv4) {
      console.info(`ℹ️ SMTP conectado via IPv4 fixo (${emailHostIpv4}) para ${emailHost}`);
    }
  }
});

const formatDateBR = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('pt-BR');
};

const resolvePrazoRetirada = (dataLimite) => {
  const prazoFormatado = formatDateBR(dataLimite);
  if (prazoFormatado) return prazoFormatado;

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  return fallback.toLocaleDateString('pt-BR');
};

/**
 * Enviar email de recuperação de senha
 */
const enviarEmailRecuperacaoSenha = async (destinatario, token) => {
  const linkRecuperacao = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/nova-senha?token=${token}`;
  
  const mailOptions = {
    from: {
      name: 'Point55',
      address: emailUser
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
    console.info('✅ Email de recuperação enviado:', info.messageId);
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
      address: emailUser
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
    console.info('✅ Email de confirmação enviado:', info.messageId);
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
      address: emailUser
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
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info('✅ Email de boas-vindas enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
};

/**
 * Enviar email de confirmação de pagamento (para o cliente)
 */
const enviarEmailConfirmacaoPagamento = async (destinatario, pedido) => {
  const linkPedido = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pedidos/${pedido.id}`;
  const isRetiradaLocal = ['retirada_local', 'retirada no local', 'retirada-no-local', 'retirada', 'retirar_no_local']
    .includes(String(pedido.entrega_tipo || '').toLowerCase().trim());

  const proximoPasso = isRetiradaLocal
    ? 'Seu pedido entrou em separação para retirada no local. Assim que a separação finalizar, você receberá outro e-mail com o código de retirada.'
    : 'Seu pedido será preparado em breve e você receberá a informação de rastreamento assim que for despachado.';
  
  const mailOptions = {
    from: {
      name: 'Point55',
      address: emailUser
    },
    to: destinatario,
    subject: `💰 Pagamento Confirmado - Pedido #${pedido.id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold; margin: 20px 0; }
          .pedido-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .pedido-info h3 { margin-top: 0; color: #059669; }
          .pedido-info p { margin: 8px 0; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #10b981; font-weight: bold; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .alert { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 6px; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
          </div>
          <div class="content">
            <p>Olá, ${pedido.nome || 'cliente'}!</p>
            <p>Ótima notícia! Seu pagamento foi confirmado com sucesso.</p>
            
            <center>
              <div class="success-badge">Pagamento Recebido</div>
            </center>
            
            <div class="pedido-info">
              <h3>Detalhes do Pedido</h3>
              <p><span class="label">Pedido:</span> #${pedido.id}</p>
              <p><span class="label">Valor Total:</span> <span class="value">R$ ${pedido.total.toFixed(2)}</span></p>
              <p><span class="label">Data:</span> ${new Date().toLocaleDateString('pt-BR')}</p>
              <p><span class="label">Status:</span> <span class="value">Pagamento Confirmado</span></p>
            </div>
            
            <div class="alert">
              <strong>📦 Próximo passo:</strong> ${proximoPasso}
            </div>
            
            <p>Acompanhe seu pedido em tempo real:</p>
            <center>
              <a href="${linkPedido}" class="button">Ver Detalhes do Pedido</a>
            </center>
            
            <p>Dúvidas? Entre em contato com a gente pelo WhatsApp: <strong>(11) 99338-5579</strong></p>
          </div>
          <div class="footer">
            <p>Point55 - Seu Estilo, Nossa Paixão</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info('✅ Email de confirmação de pagamento enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação de pagamento:', error);
    throw error;
  }
};

/**
 * Enviar notificação de pagamento para admins
 */
const enviarEmailNotificacaoPagamentoAdmin = async (administradores, pedido) => {
  const linkAdmin = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/pedidos`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-badge { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold; margin: 20px 0; }
        .pedido-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .pedido-info h3 { margin-top: 0; color: #2563eb; }
        .pedido-info p { margin: 10px 0; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #3b82f6; font-weight: bold; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .urgency { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; color: #78350f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 NOVO PAGAMENTO CONFIRMADO</h1>
        </div>
        <div class="content">
          <p>Olá, Administrador!</p>
          <p>Um novo pagamento foi confirmado no sistema.</p>
          
          <center>
            <div class="alert-badge">Pagamento Recebido</div>
          </center>
          
          <div class="pedido-info">
            <h3>Informações do Pedido</h3>
            <p><span class="label">ID do Pedido:</span> <span class="value">#${pedido.id}</span></p>
            <p><span class="label">Cliente:</span> ${pedido.nome || 'N/A'}</p>
            <p><span class="label">Email:</span> ${pedido.email || 'N/A'}</p>
            <p><span class="label">Valor do Pagamento:</span> <span class="value">R$ ${pedido.total.toFixed(2)}</span></p>
            <p><span class="label">Método de Pagamento:</span> ${pedido.forma_pagamento?.toUpperCase() || 'N/A'}</p>
            <p><span class="label">Status:</span> <span class="value">PAGO</span></p>
            <p><span class="label">Data/Hora:</span> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="urgency">
            <strong>⏰ Ação Recomendada:</strong> Verifique o pedido no painel e processe o envio assim que possível para melhor satisfação do cliente.
          </div>
          
          <p>Acesse o painel administrativo para mais detalhes:</p>
          <center>
            <a href="${linkAdmin}" class="button">Gerenciar Pedido no Painel</a>
          </center>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Este é um email automático de notificação do sistema. Não responda para este endereço.
          </p>
        </div>
        <div class="footer">
          <p>Point55 Admin System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Enviar para cada administrador
    const resultados = await Promise.allSettled(
      administradores.map(admin => 
        transporter.sendMail({
          from: {
            name: 'Point55 Admin',
            address: emailUser
          },
          to: admin.email,
          subject: `💰 Novo Pagamento Confirmado - Pedido #${pedido.id}`,
          html
        })
      )
    );

    const sucessos = resultados.filter(r => r.status === 'fulfilled').length;
    console.info(`✅ Email de notificação enviado para ${sucessos}/${administradores.length} admin(ns)`);
    
    return { 
      success: true, 
      enviados: sucessos,
      total: administradores.length 
    };
  } catch (error) {
    console.error('❌ Erro ao enviar email de notificação para admins:', error);
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
      address: emailUser
    },
    to: destinatario,
    subject: assunto,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info('✅ Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
};

const enviarEmailCodigoConfirmacaoCpf = async (destinatario, dados) => {
  const expiracao = new Date(dados.expira_em);
  const dataExpiracao = formatDateBR(expiracao) || 'hoje';
  const horaExpiracao = Number.isNaN(expiracao.getTime())
    ? 'em 5 minutos'
    : expiracao.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: #111827; color: #f9fafb; font-size: 32px; letter-spacing: 6px; text-align: center; padding: 18px; border-radius: 12px; margin: 20px 0; }
        .info-box { background: white; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #111827; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Confirmação de CPF</h1>
        </div>
        <div class="content">
          <p>Olá, ${dados.nome || 'cliente'}!</p>
          <p>Recebemos uma solicitação para corrigir o CPF cadastrado na sua conta.</p>

          <div class="info-box">
            <p><strong>Novo CPF informado:</strong> ${dados.cpf_formatado}</p>
            <p><strong>Validade do código:</strong> até ${horaExpiracao} de ${dataExpiracao}</p>
          </div>

          <div class="code-box">${dados.codigo}</div>

          <p>Digite esse código na tela do seu perfil para concluir a alteração.</p>
          <p>Se você não solicitou essa mudança, ignore este email.</p>
        </div>
        <div class="footer">
          <p>Point55 - Seu Estilo, Nossa Paixão</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return enviarEmail(destinatario, 'Código para confirmação de CPF', html);
};

const enviarEmailCodigoRetirada = async (destinatario, dados) => {
  const linkPedido = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pedidos/${dados.pedido_id}`;
  const prazoRetirada = resolvePrazoRetirada(dados.data_limite);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: #111827; color: #f9fafb; font-size: 32px; letter-spacing: 4px; text-align: center; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Retirada no Local</h1>
        </div>
        <div class="content">
          <p>Olá, ${dados.nome || 'cliente'}!</p>
          <p>Seu pedido está pronto para retirada no local. Use o código abaixo:</p>

          <div class="code-box">${dados.codigo}</div>

          <div class="info-box">
            <p><strong>Pedido:</strong> #${dados.pedido_id}</p>
            <p><strong>Local:</strong> ${dados.local}</p>
            <p><strong>Endereço:</strong> ${dados.endereco}</p>
            <p><strong>Horário:</strong> ${dados.horario}</p>
            <p><strong>Prazo para retirada:</strong> ${prazoRetirada}</p>
          </div>

          <p>Você pode apresentar o código no celular ou impresso.</p>

          <center>
            <a href="${linkPedido}" class="button">Ver Detalhes do Pedido</a>
          </center>
        </div>
        <div class="footer">
          <p>Point55 - Seu Estilo, Nossa Paixão</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return enviarEmail(destinatario, `Retirada Local - Pedido #${dados.pedido_id}`, html);
};

const enviarEmailLembreteRetirada = async (destinatario, dados) => {
  const linkPedido = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pedidos/${dados.pedido_id}`;
  const prazoRetirada = resolvePrazoRetirada(dados.data_limite);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Lembrete de Retirada</h1>
        </div>
        <div class="content">
          <p>Olá, ${dados.nome || 'cliente'}!</p>
          <p>Faltam <strong>${dados.dias_restantes} dia(s)</strong> para retirar seu pedido.</p>

          <div class="info-box">
            <p><strong>Pedido:</strong> #${dados.pedido_id}</p>
            <p><strong>Local:</strong> ${dados.local}</p>
            <p><strong>Endereço:</strong> ${dados.endereco}</p>
            <p><strong>Horário:</strong> ${dados.horario}</p>
            <p><strong>Prazo para retirada:</strong> ${prazoRetirada}</p>
          </div>

          <center>
            <a href="${linkPedido}" class="button">Ver Detalhes do Pedido</a>
          </center>
        </div>
        <div class="footer">
          <p>Point55 - Seu Estilo, Nossa Paixão</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return enviarEmail(destinatario, `Lembrete de Retirada - Pedido #${dados.pedido_id}`, html);
};

const enviarEmailCancelamentoRetirada = async (destinatario, dados) => {
  const prazoRetirada = resolvePrazoRetirada(dados.data_limite);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pedido Cancelado</h1>
        </div>
        <div class="content">
          <p>Olá, ${dados.nome || 'cliente'}!</p>
          <p>Seu pedido foi cancelado por não ter sido retirado dentro do prazo.</p>

          <div class="info-box">
            <p><strong>Pedido:</strong> #${dados.pedido_id}</p>
            <p><strong>Prazo limite:</strong> ${prazoRetirada}</p>
          </div>

          <p>Se precisar de ajuda, entre em contato com nosso atendimento.</p>
        </div>
        <div class="footer">
          <p>Point55 - Seu Estilo, Nossa Paixão</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return enviarEmail(destinatario, `Pedido #${dados.pedido_id} cancelado por prazo expirado`, html);
};

const enviarEmailCancelamentoPedidoReembolso = async (destinatario, dados) => {
  const whatsapp = process.env.SUPORTE_WHATSAPP || '(11) 99338-5579';
  const total = Number(dados.total || 0);
  const pagamentoOnlineConfirmado = Boolean(dados.pagamento_online_confirmado);
  const pagamentoOnlineSemConfirmacao = Boolean(dados.pagamento_online_sem_confirmacao);
  const dentroPrazoAutomatico = Boolean(dados.dentro_prazo_automatico);
  const reembolsoAutomaticoSolicitado = Boolean(dados.reembolso_automatico_solicitado);
  const reembolsoAutomaticoSucesso = Boolean(dados.reembolso_automatico_sucesso);
  const cobrancaCanceladaSolicitada = Boolean(dados.cobranca_cancelada_solicitada);
  const cobrancaCanceladaSucesso = Boolean(dados.cobranca_cancelada_sucesso);

  let mensagemReembolso = 'Seu pedido foi cancelado com sucesso.';

  if (pagamentoOnlineConfirmado && dentroPrazoAutomatico && reembolsoAutomaticoSolicitado && reembolsoAutomaticoSucesso) {
    mensagemReembolso = 'Como o cancelamento foi realizado dentro de 2 horas após a criação do pedido, seu reembolso foi solicitado automaticamente.';
  } else if (pagamentoOnlineConfirmado && !dentroPrazoAutomatico) {
    mensagemReembolso = `Como o cancelamento ocorreu após 2 horas da criação do pedido, o reembolso deve ser solicitado com nossa equipe. Entre em contato pelo WhatsApp ${whatsapp}.`;
  } else if (pagamentoOnlineConfirmado && dentroPrazoAutomatico && reembolsoAutomaticoSolicitado && !reembolsoAutomaticoSucesso) {
    mensagemReembolso = `Tentamos solicitar seu reembolso automaticamente, mas foi necessária análise manual. Entre em contato pelo WhatsApp ${whatsapp}.`;
  } else if (pagamentoOnlineSemConfirmacao && cobrancaCanceladaSolicitada && cobrancaCanceladaSucesso) {
    mensagemReembolso = 'O pagamento ainda não havia sido confirmado. A cobrança foi cancelada no Asaas e não houve reembolso de valor.';
  } else if (pagamentoOnlineSemConfirmacao && cobrancaCanceladaSolicitada && !cobrancaCanceladaSucesso) {
    mensagemReembolso = `O pagamento ainda não havia sido confirmado, porém não foi possível cancelar a cobrança automaticamente. Entre em contato pelo WhatsApp ${whatsapp}.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        .alert { background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 6px; color: #7c2d12; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pedido Cancelado</h1>
        </div>
        <div class="content">
          <p>Olá, ${dados.nome || 'cliente'}!</p>
          <p>Seu pedido foi cancelado conforme solicitado.</p>

          <div class="info-box">
            <p><strong>Pedido:</strong> #${dados.pedido_id}</p>
            <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
            <p><strong>Forma de pagamento:</strong> ${dados.forma_pagamento || 'N/A'}</p>
          </div>

          <div class="alert">
            <strong>Reembolso:</strong> ${mensagemReembolso}
          </div>

          <p>Se precisar de ajuda, fale com nosso time pelo WhatsApp: <strong>${whatsapp}</strong></p>
        </div>
        <div class="footer">
          <p>Point55 - Seu Estilo, Nossa Paixão</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return enviarEmail(destinatario, `Pedido #${dados.pedido_id} cancelado`, html);
};

module.exports = {
  enviarEmailRecuperacaoSenha,
  enviarEmailConfirmacaoPedido,
  enviarEmailConfirmacaoPagamento,
  enviarEmailNotificacaoPagamentoAdmin,
  enviarEmail,
  enviarEmailCodigoConfirmacaoCpf,
  enviarEmailBoasVindas,
  enviarEmailCodigoRetirada,
  enviarEmailLembreteRetirada,
  enviarEmailCancelamentoRetirada,
  enviarEmailCancelamentoPedidoReembolso
};
