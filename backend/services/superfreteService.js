const axios = require('axios');
const fs = require('fs');
const https = require('https');

const parseNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value, fallback = false) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const normalizeCep = (cep) => {
  if (!cep) {
    return '';
  }

  return String(cep).replace(/\D/g, '');
};

const buildUrl = (baseUrl, path) => {
  const normalizedBase = (baseUrl || '').replace(/\/$/, '');
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  try {
    const parsedBase = new URL(`${normalizedBase}/`);
    const basePath = parsedBase.pathname.replace(/\/$/, '');

    if (basePath && basePath !== '/' && normalizedPath.startsWith(`${basePath}/`)) {
      normalizedPath = normalizedPath.slice(basePath.length);
    }
  } catch (error) {
    // Mantem a montagem simples se baseUrl nao for uma URL absoluta valida.
  }

  return `${normalizedBase}${normalizedPath}`;
};

const parseCsv = (value) => {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const uniqueList = (values) => [...new Set(values.filter(Boolean))];

const pareceHtml = (contentType, data) => {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('text/html')) {
    return true;
  }

  if (typeof data === 'string') {
    const normalized = data.trim().toLowerCase();
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
  }

  return false;
};

const getSuperfreteConfig = () => {
  const baseUrl = process.env.SUPERFRETE_BASE_URL || 'https://sandbox.superfrete.com/api/v0';
  const baseUrls = uniqueList([
    ...parseCsv(process.env.SUPERFRETE_BASE_URLS),
    baseUrl,
  ]);
  const token = process.env.SUPERFRETE_TOKEN;
  const authHeader = process.env.SUPERFRETE_AUTH_HEADER || 'Authorization';
  const authPrefix = process.env.SUPERFRETE_AUTH_PREFIX || 'Bearer ';
  const userAgent = process.env.SUPERFRETE_USER_AGENT || 'Point55/1.0 (atendimento.sacpoint@gmail.com)';
  const timeout = parseNumber(process.env.SUPERFRETE_TIMEOUT_MS) ?? 15000;
  const rejectUnauthorized = parseBoolean(process.env.SUPERFRETE_REJECT_UNAUTHORIZED, true);
  const caCertPath = process.env.SUPERFRETE_CA_CERT_PATH || '';

  if (!token) {
    throw new Error('Token SuperFrete não configurado');
  }

  return {
    baseUrl,
    baseUrls,
    token,
    authHeader,
    authPrefix,
    userAgent,
    timeout,
    rejectUnauthorized,
    caCertPath,
  };
};

const buildHttpsAgent = (config) => {
  const agentOptions = {
    rejectUnauthorized: config.rejectUnauthorized,
  };

  if (config.caCertPath) {
    try {
      agentOptions.ca = fs.readFileSync(config.caCertPath);
    } catch (error) {
      console.warn(`⚠️ SUPERFRETE_CA_CERT_PATH inválido (${config.caCertPath}): ${error.message}`);
    }
  }

  return new https.Agent(agentOptions);
};

const buildAuthHeaders = (config) => {
  const normalizedAuthPrefix = config.authPrefix.endsWith(' ')
    ? config.authPrefix
    : `${config.authPrefix} `;

  return {
    'Content-Type': 'application/json',
    [config.authHeader]: `${normalizedAuthPrefix}${config.token}`.trim(),
    'User-Agent': config.userAgent,
  };
};

const requestSuperfrete = async (method, path, data, options = {}) => {
  const config = getSuperfreteConfig();
  const selectedBaseUrl = options.baseUrl || config.baseUrl;
  const url = buildUrl(selectedBaseUrl, path);
  const headers = buildAuthHeaders(config);
  const httpsAgent = buildHttpsAgent(config);

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: config.timeout,
      httpsAgent,
    });

    if (options.returnNullOn404 && pareceHtml(response?.headers?.['content-type'], response?.data)) {
      return null;
    }

    return response.data;
  } catch (error) {
    const responseData = error?.response?.data;
    if (responseData) {
      error.superfreteResponse = responseData;
    }

    if (error?.message?.toLowerCase().includes('certificate')) {
      error.superfreteHint = 'Falha TLS com SuperFrete. Verifique certificado local/empresa, SUPERFRETE_CA_CERT_PATH ou use SUPERFRETE_REJECT_UNAUTHORIZED=false somente em ambiente controlado.';
      console.error(`❌ ${error.superfreteHint}`);
    }

    if (options.returnNullOn404 && error?.response?.status === 404) {
      return null;
    }

    throw error;
  }
};

const requestSuperfreteComFallback404 = async ({
  method,
  paths,
  data,
  fallbackBases,
}) => {
  const config = getSuperfreteConfig();
  const candidateBases = uniqueList([
    ...config.baseUrls,
    ...fallbackBases,
  ]);
  const candidatePaths = uniqueList(paths);

  let non404Error = null;

  for (const base of candidateBases) {
    for (const currentPath of candidatePaths) {
      try {
        const response = await requestSuperfrete(method, currentPath, data, {
          baseUrl: base,
          returnNullOn404: true,
        });

        if (response !== null) {
          if (base !== config.baseUrl || currentPath !== candidatePaths[0]) {
            console.warn(`⚠️ SuperFrete respondeu usando fallback (${base}${currentPath})`);
          }
          return response;
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          continue;
        }

        non404Error = error;
        break;
      }
    }

    if (non404Error) {
      break;
    }
  }

  if (non404Error) {
    throw non404Error;
  }

  return null;
};

const extractQuotes = (data) => {
  const candidates = Array.isArray(data)
    ? data
    : data?.data || data?.result || data?.servicos || data?.quotes || data?.cotacoes || [];

  if (!Array.isArray(candidates)) {
    return { quotes: [], raw: data };
  }

  const quotes = candidates
    .map((item) => {
      const valor = parseNumber(
        item?.valor ?? item?.preco ?? item?.price ?? item?.custo ?? item?.valor_frete
      );
      const prazo = parseNumber(item?.prazo ?? item?.prazo_entrega ?? item?.delivery_time);
      const servico = item?.servico ?? item?.nome ?? item?.name ?? item?.codigo ?? item?.id;

      return {
        valor,
        prazo,
        servico,
        raw: item,
      };
    })
    .filter((quote) => quote.valor !== null);

  return { quotes, raw: data };
};

const selectBestQuote = (quotes) => {
  if (!quotes || quotes.length === 0) {
    return null;
  }

  return [...quotes].sort((a, b) => a.valor - b.valor)[0];
};

const calcularFreteSuperfrete = async ({
  cepDestino,
  valorDeclarado,
  peso,
  altura,
  largura,
  comprimento,
  services,
  formato,
  maoPropria,
  avisoRecebimento,
  rawPayload,
  volumes, // Array de volumes calculados pelo embalagemService
}) => {
  const calcPath = process.env.SUPERFRETE_CALC_PATH || '/calculator';
  const calcPaths = uniqueList([
    ...parseCsv(process.env.SUPERFRETE_CALC_PATHS),
    calcPath,
    '/calculator',
    '/api/v0/calculator',
  ]);
  const fallbackBases = [
    'https://sandbox.superfrete.com/api/v0',
    'https://web.superfrete.com/api/v0',
  ];
  const cepOrigem = process.env.SUPERFRETE_CEP_ORIGEM || '04349000';
  const pesoPadrao = parseNumber(process.env.SUPERFRETE_PESO_PADRAO) ?? 0.5;
  const alturaPadrao = parseNumber(process.env.SUPERFRETE_ALTURA_PADRAO) ?? 4;
  const larguraPadrao = parseNumber(process.env.SUPERFRETE_LARGURA_PADRAO) ?? 12;
  const comprimentoPadrao = parseNumber(process.env.SUPERFRETE_COMPRIMENTO_PADRAO) ?? 17;

  const insuranceValue = parseNumber(valorDeclarado) ?? 0;
  
  let payload;
  
  // Se volumes foram calculados pelo embalagemService, usar formato de múltiplos volumes
  if (volumes && Array.isArray(volumes) && volumes.length > 0) {
    const packageFromVolumes = volumes.reduce(
      (acc, volume) => ({
        height: Math.max(acc.height, parseNumber(volume.height) ?? 0),
        width: Math.max(acc.width, parseNumber(volume.width) ?? 0),
        length: Math.max(acc.length, parseNumber(volume.length) ?? 0),
        weight: (acc.weight ?? 0) + (parseNumber(volume.weight) ?? 0),
      }),
      { height: 0, width: 0, length: 0, weight: 0 }
    );

    payload = {
      from: { postal_code: normalizeCep(cepOrigem) },
      to: { postal_code: normalizeCep(cepDestino) },
      options: {
        own_hand: maoPropria ?? false,
        receipt: avisoRecebimento ?? false,
        insurance_value: insuranceValue,
        use_insurance_value: insuranceValue > 0,
      },
      volumes: volumes, // Múltiplos volumes (caixas)
      package: {
        height: packageFromVolumes.height || alturaPadrao,
        width: packageFromVolumes.width || larguraPadrao,
        length: packageFromVolumes.length || comprimentoPadrao,
        weight: packageFromVolumes.weight || pesoPadrao,
      },
    };
    
    console.info('📦 Usando múltiplos volumes:', volumes.length);
  } else {
    // Formato antigo com package único (fallback)
    payload = rawPayload || {
      from: { postal_code: normalizeCep(cepOrigem) },
      to: { postal_code: normalizeCep(cepDestino) },
      options: {
        own_hand: maoPropria ?? false,
        receipt: avisoRecebimento ?? false,
        insurance_value: insuranceValue,
        use_insurance_value: insuranceValue > 0,
      },
      package: {
        height: parseNumber(altura) ?? alturaPadrao,
        width: parseNumber(largura) ?? larguraPadrao,
        length: parseNumber(comprimento) ?? comprimentoPadrao,
        weight: parseNumber(peso) ?? pesoPadrao,
      },
    };
  }

  const servicesValue = services || process.env.SUPERFRETE_SERVICES;
  if (!rawPayload && servicesValue) {
    payload.services = servicesValue;
  }

  const response = await requestSuperfreteComFallback404({
    method: 'post',
    paths: calcPaths,
    data: payload,
    fallbackBases,
  });

  if (response === null) {
    console.warn('⚠️ SuperFrete retornou 404 em todas as rotas de cálculo candidatas; aplicando fallback de frete local.');
    return {
      best: null,
      quotes: [],
      raw: {
        warning: 'superfrete_endpoint_not_found',
        attempted_paths: calcPaths,
      },
    };
  }

  const { quotes, raw } = extractQuotes(response);
  const best = selectBestQuote(quotes);

  if (!best && typeof raw === 'string') {
    return {
      best: null,
      quotes,
      raw: {
        warning: 'superfrete_invalid_payload',
      },
    };
  }

  return {
    best,
    quotes,
    raw,
  };
};

const obterInformacoesPacotesSuperfrete = async () => {
  const packagesPath = process.env.SUPERFRETE_PACKAGES_PATH || '/packages';
  return requestSuperfrete('get', packagesPath);
};

const enviarFreteSuperfrete = async (payload) => {
  const cartPath = process.env.SUPERFRETE_CART_PATH || '/cart';
  return requestSuperfrete('post', cartPath, payload);
};

const finalizarPedidoSuperfrete = async (orders) => {
  const checkoutPath = process.env.SUPERFRETE_CHECKOUT_PATH || '/checkout';
  return requestSuperfrete('post', checkoutPath, { orders });
};

const obterPedidoSuperfrete = async (orderId) => {
  const tagInfoPath = process.env.SUPERFRETE_TAG_INFO_PATH || '/tag/{id}';
  let resolvedPath = tagInfoPath;

  if (resolvedPath.includes('{id}')) {
    resolvedPath = resolvedPath.replace('{id}', orderId);
  } else {
    resolvedPath = `${resolvedPath.replace(/\/$/, '')}/${orderId}`;
  }

  return requestSuperfrete('get', resolvedPath);
};

const obterLinkEtiquetaSuperfrete = async (orders) => {
  const printPath = process.env.SUPERFRETE_TAG_PRINT_PATH || '/tag/print';
  return requestSuperfrete('post', printPath, { orders });
};

const cancelarPedidoSuperfrete = async (orderId, reason, payload) => {
  const cancelPath = process.env.SUPERFRETE_CANCEL_PATH || '/order/cancel';
  const body = payload || {
    order: {
      id: orderId,
      reason: reason || 'cancelamento solicitado',
    },
  };

  return requestSuperfrete('post', cancelPath, body);
};

module.exports = {
  calcularFreteSuperfrete,
  obterInformacoesPacotesSuperfrete,
  enviarFreteSuperfrete,
  finalizarPedidoSuperfrete,
  obterPedidoSuperfrete,
  obterLinkEtiquetaSuperfrete,
  cancelarPedidoSuperfrete,
};
