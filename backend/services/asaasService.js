const axios = require('axios');

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
const normalizeAsaasToken = (value) => {
  let token = String(value || '').trim();

  // Corrige token colado com escape duplo comum em .env ($$aact_...)
  if (token.startsWith('$$aact_')) {
    token = token.slice(1);
  }

  // Remove aspas acidentais em volta do token
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }

  return token;
};

const ASAAS_TOKEN = normalizeAsaasToken(process.env.ASAAS_TOKEN || '');
const ASAAS_AUTH_HEADER = process.env.ASAAS_AUTH_HEADER || 'access_token';
const ASAAS_AUTH_PREFIX = process.env.ASAAS_AUTH_PREFIX || '';

const buildHeaders = () => {
  if (!ASAAS_TOKEN) {
    throw new Error('ASAAS_TOKEN não configurado');
  }

  const tokenValue = `${ASAAS_AUTH_PREFIX}${ASAAS_TOKEN}`.trim();
  return {
    [ASAAS_AUTH_HEADER]: tokenValue,
  };
};

const asaasApi = axios.create({
  baseURL: ASAAS_BASE_URL,
  timeout: 15000,
});

const requestAsaas = async (method, url, data) => {
  const headers = buildHeaders();
  const response = await asaasApi.request({
    method,
    url,
    data,
    headers,
  });

  return response.data;
};

const createCustomer = async (payload) => requestAsaas('POST', '/customers', payload);

const createPayment = async (payload) => requestAsaas('POST', '/payments', payload);

const getPayment = async (paymentId) => requestAsaas('GET', `/payments/${paymentId}`);

const getPixQrCode = async (paymentId) => requestAsaas('GET', `/payments/${paymentId}/pixQrCode`);

const cancelPayment = async (paymentId) => requestAsaas('DELETE', `/payments/${paymentId}`);

const refundPayment = async (paymentId, payload = {}) => requestAsaas('POST', `/payments/${paymentId}/refund`, payload);

module.exports = {
  createCustomer,
  createPayment,
  getPayment,
  getPixQrCode,
  cancelPayment,
  refundPayment,
};
