const express = require('express');
const router = express.Router();
const {
  asaasWebhook,
  validateAsaasWebhook,
} = require('../controllers/webhookController');

/**
 * Rota de webhook do Asaas
 * POST /api/webhooks/asaas
 * 
 * Esta rota recebe notificações automáticas do Asaas sobre mudanças
 * no status de pagamentos (confirmação, vencimento, reembolso, etc)
 * 
 * Configuração no painel Asaas:
 * 1. Acesse: Configurações > Integrações > Webhooks
 * 2. URL: https://seudominio.com/api/webhooks/asaas
 * 3. Eventos: Marcar todos relacionados a Payment
 * 4. Header de autenticação (opcional): X-Webhook-Token
 * 
 * Para sandbox/desenvolvimento local, use ngrok ou similar:
 * ngrok http 5000
 * URL do webhook: https://xxxx.ngrok.io/api/webhooks/asaas
 */
router.post('/asaas', validateAsaasWebhook, asaasWebhook);

/**
 * Rota de teste do webhook (apenas para desenvolvimento)
 * GET /api/webhooks/asaas/test
 */
router.get('/asaas/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook Asaas está configurado e funcionando',
    url: `${req.protocol}://${req.get('host')}/api/webhooks/asaas`,
    token_configured: !!process.env.ASAAS_WEBHOOK_TOKEN,
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
