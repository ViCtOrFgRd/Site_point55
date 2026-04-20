const { pool } = require('../config/database');
const {
  enviarFreteSuperfrete,
  finalizarPedidoSuperfrete,
} = require('./superfreteService');
const {
  calcularVolumesFrete,
  formatarParaServicoFrete,
} = require('./embalagemService');

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

const extractSuperfreteInfo = (data) => {
  const orderId =
    data?.id ||
    data?.order_id ||
    data?.order?.id ||
    data?.data?.id ||
    data?.data?.order?.id ||
    data?.orderId ||
    null;

  const status = data?.status || data?.order?.status || data?.data?.status || null;
  const tracking = data?.tracking || data?.order?.tracking || data?.data?.tracking || null;
  const etiquetaUrl =
    data?.label_url || data?.url || data?.pdf || data?.data?.url || data?.data?.label_url || null;

  return {
    orderId,
    status,
    tracking,
    etiquetaUrl,
  };
};

const resolveDefaultService = () => {
  const defaultService = process.env.SUPERFRETE_DEFAULT_SERVICE;
  if (defaultService) {
    return defaultService;
  }

  const services = process.env.SUPERFRETE_SERVICES;
  if (!services) {
    return null;
  }

  return String(services).split(',')[0]?.trim() || null;
};

const buildDefaultVolume = () => ({
  height: parseNumber(process.env.SUPERFRETE_ALTURA_PADRAO) ?? 4,
  width: parseNumber(process.env.SUPERFRETE_LARGURA_PADRAO) ?? 12,
  length: parseNumber(process.env.SUPERFRETE_COMPRIMENTO_PADRAO) ?? 17,
  weight: parseNumber(process.env.SUPERFRETE_PESO_PADRAO) ?? 0.5,
});

const requireRemetente = () => {
  const normalizeNomeCompleto = (value, prefix) => {
    if (!value) {
      return value;
    }

    const trimmed = String(value).trim();
    if (trimmed.includes(' ')) {
      return trimmed;
    }

    return `${prefix} ${trimmed}`.trim();
  };

  const normalizeDocumento = (value) => {
    if (!value) {
      return undefined;
    }

    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 14) {
      return digits;
    }

    return undefined;
  };

  const remetente = {
    name: normalizeNomeCompleto(process.env.SUPERFRETE_REMETENTE_NOME, 'Loja'),
    address: process.env.SUPERFRETE_REMETENTE_ENDERECO,
    complement: process.env.SUPERFRETE_REMETENTE_COMPLEMENTO || '',
    number: process.env.SUPERFRETE_REMETENTE_NUMERO || '',
    district: process.env.SUPERFRETE_REMETENTE_BAIRRO || 'NA',
    city: process.env.SUPERFRETE_REMETENTE_CIDADE,
    state_abbr: process.env.SUPERFRETE_REMETENTE_ESTADO,
    postal_code: process.env.SUPERFRETE_REMETENTE_CEP,
    document: normalizeDocumento(process.env.SUPERFRETE_REMETENTE_DOCUMENTO),
  };

  const missing = Object.entries(remetente)
    .filter(([key]) => ['name', 'address', 'district', 'city', 'state_abbr', 'postal_code'].includes(key))
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return { remetente, missing, normalizeNomeCompleto, normalizeDocumento };
};

const createHttpError = (statusCode, message, details) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details !== undefined) {
    error.details = details;
  }
  return error;
};

const LABEL_STATUS_CREATED_PENDING_PAYMENT = 'label_created_pending_payment';
const LABEL_STATUS_READY_TO_PRINT = 'label_paid_ready_to_print';

const normalizeSuperfreteStatus = (value, fallback = null) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || fallback;
};

const isSuperfreteLabelReady = (value) => {
  const normalized = normalizeSuperfreteStatus(value);
  if (!normalized) {
    return false;
  }

  if (normalized === LABEL_STATUS_READY_TO_PRINT) {
    return true;
  }

  const readyKeywords = ['paid', 'pago', 'ready', 'printed', 'released', 'success', 'approved', 'completed', 'generated'];
  return readyKeywords.some((keyword) => normalized.includes(keyword));
};

const buscarPedidoParaEtiqueta = async (pedidoId, userId, isAdmin = false) => {
  let query = `
    SELECT p.*, 
           e.cep, e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.estado,
           u.nome as usuario_nome, u.email as usuario_email, u.cpf as usuario_cpf
    FROM pedidos p
    LEFT JOIN enderecos e ON p.endereco_entrega_id = e.id
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.id = $1
  `;

  const params = [pedidoId];

  if (!isAdmin) {
    query += ' AND p.usuario_id = $2';
    params.push(userId);
  }

  const pedidoResult = await pool.query(query, params);
  if (pedidoResult.rows.length === 0) {
    return null;
  }

  const itensResult = await pool.query(
    `SELECT ip.*, p.nome as produto_nome
     FROM itens_pedido ip
     LEFT JOIN produtos p ON ip.produto_id = p.id
     WHERE ip.pedido_id = $1`,
    [pedidoId]
  );

  return {
    pedido: pedidoResult.rows[0],
    itens: itensResult.rows,
  };
};

const calcularVolumesPedido = async (itens) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    return [buildDefaultVolume()];
  }

  const itensParaCalculo = itens.map((item) => ({
    produto_id: item.produto_id,
    quantidade: item.quantidade,
  }));

  const volumes = await calcularVolumesFrete(itensParaCalculo);
  const volumesFormatados = formatarParaServicoFrete(volumes);

  return volumesFormatados.length > 0 ? volumesFormatados : [buildDefaultVolume()];
};

const montarPayloadEtiqueta = async ({ pedido, itens, requestData = {} }) => {
  const { service, options, volume, volumes, products, invoice, payload } = requestData;
  const { remetente, missing, normalizeNomeCompleto, normalizeDocumento } = requireRemetente();

  if (!payload && missing.length) {
    throw createHttpError(400, `Dados do remetente incompletos: ${missing.join(', ')}`);
  }

  const serviceValue = service || resolveDefaultService();
  if (!payload && !serviceValue) {
    throw createHttpError(400, 'Servico SuperFrete nao informado');
  }

  let volumeValue = volumes || volume || null;

  if (!payload && !volumeValue) {
    try {
      volumeValue = await calcularVolumesPedido(itens);
    } catch (error) {
      console.error('Erro ao calcular volumes para etiqueta:', error.message || error);
      volumeValue = [buildDefaultVolume()];
    }
  }

  if (volumeValue && !Array.isArray(volumeValue)) {
    volumeValue = [volumeValue];
  }

  const optionsValue = options || {
    insurance_value: parseNumber(pedido.subtotal) ?? 0,
    receipt: false,
    own_hand: false,
    non_commercial: true,
  };

  const productsValue = products || itens.map((item) => ({
    name: item.produto_nome || `Produto ${item.produto_id}`,
    quantity: item.quantidade,
    unitary_value: parseNumber(item.preco_unitario) ?? 0,
  }));

  return payload || {
    from: remetente,
    to: {
      name: normalizeNomeCompleto(pedido.usuario_nome || 'Cliente', 'Cliente'),
      address: pedido.rua,
      complement: pedido.complemento || '',
      number: pedido.numero || '',
      district: pedido.bairro || 'NA',
      city: pedido.cidade,
      state_abbr: pedido.estado,
      postal_code: pedido.cep,
      email: pedido.usuario_email || undefined,
      document: normalizeDocumento(pedido.usuario_cpf),
    },
    service: parseNumber(serviceValue) ?? serviceValue,
    products: productsValue,
    volumes: volumeValue,
    options: optionsValue,
    invoice: invoice || undefined,
    tag: `pedido-${pedido.id}`,
    url: process.env.FRONTEND_URL || undefined,
    platform: process.env.SUPERFRETE_PLATFORM || 'Point55',
  };
};

const criarEtiquetaPedido = async ({ pedidoId, userId, isAdmin = false, requestData = {} }) => {
  const pedidoData = await buscarPedidoParaEtiqueta(pedidoId, userId, isAdmin);

  if (!pedidoData) {
    throw createHttpError(404, 'Pedido nao encontrado');
  }

  const { pedido, itens } = pedidoData;

  if (String(pedido.entrega_tipo || '').toLowerCase() !== 'entrega') {
    throw createHttpError(400, 'Etiqueta disponivel apenas para pedidos de entrega');
  }

  if (pedido.superfrete_pedido_id) {
    throw createHttpError(409, 'Pedido ja possui etiqueta SuperFrete criada');
  }

  const payloadValue = await montarPayloadEtiqueta({ pedido, itens, requestData });
  const result = await enviarFreteSuperfrete(payloadValue);
  const info = extractSuperfreteInfo(result);

  const updated = await pool.query(
    `UPDATE pedidos
     SET superfrete_pedido_id = $1,
         superfrete_etiqueta_id = $2,
         superfrete_status = $3,
         superfrete_etiqueta_url = $4,
         superfrete_raw_json = $5,
         data_atualizacao = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      info.orderId,
      info.orderId,
      normalizeSuperfreteStatus(info.status, LABEL_STATUS_CREATED_PENDING_PAYMENT),
      null,
      result,
      pedidoId,
    ]
  );

  return {
    pedido: updated.rows[0],
    superfrete: result,
    info,
  };
};

const pagarEtiquetaPedido = async ({ pedidoId, userId, isAdmin = false }) => {
  const pedidoData = await buscarPedidoParaEtiqueta(pedidoId, userId, isAdmin);

  if (!pedidoData) {
    throw createHttpError(404, 'Pedido nao encontrado');
  }

  const orderId = pedidoData.pedido.superfrete_pedido_id;
  if (!orderId) {
    throw createHttpError(400, 'Pedido ainda nao possui etiqueta SuperFrete');
  }

  const result = await finalizarPedidoSuperfrete([orderId]);
  const info = extractSuperfreteInfo(result);

  const updated = await pool.query(
    `UPDATE pedidos
     SET superfrete_status = $1,
         superfrete_etiqueta_url = COALESCE($2, superfrete_etiqueta_url),
         superfrete_raw_json = $3,
         status = CASE WHEN status = 'pendente' THEN 'processando' ELSE status END,
         data_atualizacao = NOW()
     WHERE id = $4
     RETURNING *`,
    [
      normalizeSuperfreteStatus(info.status, LABEL_STATUS_READY_TO_PRINT),
      info.etiquetaUrl || null,
      result,
      pedidoId,
    ]
  );

  return {
    pedido: updated.rows[0],
    superfrete: result,
    info,
  };
};

module.exports = {
  buscarPedidoParaEtiqueta,
  buildDefaultVolume,
  extractSuperfreteInfo,
  resolveDefaultService,
  requireRemetente,
  normalizeSuperfreteStatus,
  isSuperfreteLabelReady,
  LABEL_STATUS_CREATED_PENDING_PAYMENT,
  LABEL_STATUS_READY_TO_PRINT,
  criarEtiquetaPedido,
  pagarEtiquetaPedido,
};