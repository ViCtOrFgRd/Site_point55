const axios = require('axios');

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

const normalizeCep = (cep) => {
  if (!cep) {
    return '';
  }

  return String(cep).replace(/\D/g, '');
};

const buildUrl = (baseUrl, path) => {
  const normalizedBase = (baseUrl || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
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
}) => {
  const baseUrl = process.env.SUPERFRETE_BASE_URL || 'https://sandbox.superfrete.com/api/v0';
  const calcPath = process.env.SUPERFRETE_CALC_PATH || '/calculator';
  const token = process.env.SUPERFRETE_TOKEN;
  const authHeader = process.env.SUPERFRETE_AUTH_HEADER || 'Authorization';
  const authPrefix = process.env.SUPERFRETE_AUTH_PREFIX || 'Bearer ';
  const userAgent = process.env.SUPERFRETE_USER_AGENT || 'Point55/1.0 (contato@point55.com)';

  if (!token) {
    throw new Error('Token SuperFrete nao configurado');
  }

  const cepOrigem = process.env.SUPERFRETE_CEP_ORIGEM || '04349000';
  const pesoPadrao = parseNumber(process.env.SUPERFRETE_PESO_PADRAO) ?? 0.5;
  const alturaPadrao = parseNumber(process.env.SUPERFRETE_ALTURA_PADRAO) ?? 4;
  const larguraPadrao = parseNumber(process.env.SUPERFRETE_LARGURA_PADRAO) ?? 12;
  const comprimentoPadrao = parseNumber(process.env.SUPERFRETE_COMPRIMENTO_PADRAO) ?? 17;

  const insuranceValue = parseNumber(valorDeclarado) ?? 0;
  const payload = rawPayload || {
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

  const servicesValue = services || process.env.SUPERFRETE_SERVICES;
  if (!rawPayload && servicesValue) {
    payload.services = servicesValue;
  }

  const url = buildUrl(baseUrl, calcPath);
  const normalizedAuthPrefix = authPrefix.endsWith(' ') ? authPrefix : `${authPrefix} `;
  const headers = {
    'Content-Type': 'application/json',
    [authHeader]: `${normalizedAuthPrefix}${token}`.trim(),
    'User-Agent': userAgent,
  };

  const response = await axios.post(url, payload, {
    headers,
    timeout: 15000,
  });

  const { quotes, raw } = extractQuotes(response.data);
  const best = selectBestQuote(quotes);

  return {
    best,
    quotes,
    raw,
  };
};

module.exports = {
  calcularFreteSuperfrete,
};
