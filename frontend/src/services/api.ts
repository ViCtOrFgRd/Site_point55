import axios from 'axios';

// Interface para padronizar respostas da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  nao_lidas?: number;
  token?: string;
  pagination?: {
    total: number;
    pagina: number;
    totalPaginas: number;
  };
}

// Backend rodando na porta 5000 conforme etapa 3
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    // Apenas no cliente (não no SSR)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ Token não encontrado no localStorage');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    // Retorna os dados da API no padrão { success, data, message }
    return response.data || response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/perfil') {
          window.location.href = '/perfil'; // Redireciona para página de perfil/login
        }
      }
    }
    
    // Retorna erro estruturado - prioriza error.response.data.error do backend
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Erro ao processar requisição';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// ==================== PRODUTOS ====================
export const productService = {
  // Listar produtos com filtros avançados
  getAll: (params?: {
    categoria?: number;
    busca?: string;
    precoMin?: number;
    precoMax?: number;
    promocao?: boolean;
    ordem?: 'data_criacao' | 'preco' | 'nome' | 'vendas';
    direcao?: 'ASC' | 'DESC';
    pagina?: number;
    limite?: number;
  }): Promise<ApiResponse> => api.get('/produtos', { params }),
  
  getById: (id: number): Promise<ApiResponse> => api.get(`/produtos/${id}`),
  
  getByCategory: (categoryId: number, params?: Record<string, unknown>): Promise<ApiResponse> => 
    api.get(`/categorias/${categoryId}/produtos`, { params }),
  
  // Produtos em promoção
  getPromocoes: (params?: Record<string, unknown>): Promise<ApiResponse> => api.get('/produtos/promocoes', { params }),
  
  // Produtos em destaque (mais vendidos)
  getDestaques: (params?: Record<string, unknown>): Promise<ApiResponse> => api.get('/produtos/destaques', { params }),
  
  search: (query: string, params?: Record<string, unknown>): Promise<ApiResponse> => 
    api.get('/produtos', { params: { busca: query, ...params } }),
  
  // Admin: Criar produto
  create: (data: Record<string, unknown>): Promise<ApiResponse> => api.post('/produtos', data),

  // Admin: Listar produtos (completos)
  getAllAdmin: (params?: {
    categoria?: number | string;
    busca?: string;
    precoMin?: number;
    precoMax?: number;
    promocao?: boolean;
    ordem?: 'data_criacao' | 'preco' | 'nome' | 'vendas';
    direcao?: 'ASC' | 'DESC';
    pagina?: number;
    limite?: number;
  }): Promise<ApiResponse> => api.get('/produtos/admin', { params }),
  
  // Admin: Atualizar produto
  update: (id: number, data: Record<string, unknown>): Promise<ApiResponse> => api.put(`/produtos/${id}`, data),
  
  // Admin: Atualizar estoque
  updateStock: (id: number, quantidade: number): Promise<ApiResponse> => 
    api.patch(`/produtos/${id}/estoque`, { quantidade }),
  
  // Admin: Deletar produto (desativa se ativo, remove se já inativo)
  delete: (id: number): Promise<ApiResponse> => api.delete(`/produtos/${id}`),
};

// ==================== CATEGORIAS ====================
export const categoryService = {
  getAll: (): Promise<ApiResponse> => api.get('/categorias'),
  getAllAdmin: (): Promise<ApiResponse> => api.get('/categorias/admin'),
  getById: (id: number): Promise<ApiResponse> => api.get(`/categorias/${id}`),
  
  // Admin
  create: (data: Record<string, unknown>): Promise<ApiResponse> => api.post('/categorias', data),
  update: (id: number, data: Record<string, unknown>): Promise<ApiResponse> => api.put(`/categorias/${id}`, data),
  delete: (id: number): Promise<ApiResponse> => api.delete(`/categorias/${id}`),
};

// ==================== AUTENTICAÇÃO ====================
export const authService = {
  // Login
  login: (email: string, senha: string): Promise<ApiResponse> => 
    api.post('/auth/login', { email, senha }),
  
  // Registro
  register: (data: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    cpf?: string;
    data_nascimento?: string;
  }): Promise<ApiResponse> => api.post('/auth/registro', data),
  
  // Obter perfil
  getProfile: (): Promise<ApiResponse> => api.get('/auth/perfil'),
  
  // Atualizar perfil
  updateProfile: (data: {
    nome?: string;
    telefone?: string;
    cpf?: string;
    data_nascimento?: string;
  }): Promise<ApiResponse> => api.put('/auth/perfil', data),

  requestCpfChangeCode: (cpf: string): Promise<ApiResponse> =>
    api.post('/auth/perfil/cpf/codigo', { cpf }),

  confirmCpfChange: (cpf: string, codigo: string): Promise<ApiResponse> =>
    api.post('/auth/perfil/cpf/confirmar', { cpf, codigo }),
  
  // Alterar senha
  changePassword: (senhaAtual: string, novaSenha: string): Promise<ApiResponse> => 
    api.put('/auth/senha', { senhaAtual, novaSenha }),
};

// ==================== ENDEREÇOS ====================
export const addressService = {
  // Listar endereços do usuário
  getAll: (): Promise<ApiResponse> => api.get('/enderecos'),
  
  // Obter endereço específico
  getById: (id: number): Promise<ApiResponse> => api.get(`/enderecos/${id}`),
  
  // Adicionar novo endereço
  create: (data: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais?: string;
    is_principal?: boolean;
  }): Promise<ApiResponse> => api.post('/enderecos', data),
  
  // Atualizar endereço
  update: (id: number, data: Record<string, unknown>): Promise<ApiResponse> => api.put(`/enderecos/${id}`, data),
  
  // Deletar endereço
  delete: (id: number): Promise<ApiResponse> => api.delete(`/enderecos/${id}`),
  
  // Definir como endereço principal
  setPrincipal: (id: number): Promise<ApiResponse> => api.patch(`/enderecos/${id}/principal`),
};

// ==================== PEDIDOS ====================
export const orderService = {
  // Criar novo pedido
  create: (data: {
    itens: Array<{
      produto_id: number;
      quantidade: number;
      tamanho?: string;
      cor?: string;
    }>;
    endereco_entrega_id: number;
    forma_pagamento: 'cartao' | 'pix' | 'boleto' | 'local';
    parcelas?: number;
    cupom_codigo?: string;
    entrega_tipo?: 'entrega' | 'retirada_local';
    frete_valor?: number;
    pagamento_na_retirada?: boolean;
  }): Promise<ApiResponse> => api.post('/pedidos', data),
  
  // Listar pedidos do usuário
  getAll: (params?: { status?: string; pagina?: number; limite?: number }): Promise<ApiResponse> => 
    api.get('/pedidos', { params }),
  
  // Obter pedido específico
  getById: (id: number): Promise<ApiResponse> => api.get(`/pedidos/${id}`),

  // Atualizar QR Code PIX
  refreshPix: (id: number): Promise<ApiResponse> => api.post(`/pedidos/${id}/pix/refresh`, {}),
  
  // Obter informações de rastreamento
  getTracking: (id: number): Promise<ApiResponse> => api.get(`/pedidos/${id}/rastreamento`),
  
  // Cancelar pedido
  cancel: (id: number, motivo?: string): Promise<ApiResponse> => 
    api.post(`/pedidos/${id}/cancelar`, { motivo }),
  
  // Admin: Atualizar status
  updateStatus: (id: number, status: string, observacao?: string): Promise<ApiResponse> => 
    api.put(`/pedidos/${id}/status`, { status, observacao }),
  
  // Admin: Adicionar código de rastreio
  addTracking: (id: number, codigo_rastreio: string, url_rastreamento?: string): Promise<ApiResponse> => 
    api.put(`/pedidos/${id}/rastreio`, { codigo_rastreio, url_rastreamento }),

  // SuperFrete: Criar etiqueta
  createLabel: (id: number, data?: {
    service?: number | string;
    options?: Record<string, unknown>;
    volume?: Record<string, unknown>;
    volumes?: Record<string, unknown>;
    products?: Array<Record<string, unknown>>;
    invoice?: Record<string, unknown>;
    payload?: Record<string, unknown>;
  }): Promise<ApiResponse> => api.post(`/pedidos/${id}/etiqueta`, data || {}),

  // SuperFrete: Finalizar etiqueta
  payLabel: (id: number): Promise<ApiResponse> => api.post(`/pedidos/${id}/etiqueta/pagar`, {}),

  // SuperFrete: Informacoes da etiqueta
  getLabelInfo: (id: number): Promise<ApiResponse> => api.get(`/pedidos/${id}/etiqueta`),

  // SuperFrete: Link de impressao
  printLabel: (id: number): Promise<ApiResponse> => api.post(`/pedidos/${id}/etiqueta/print`, {}),

  // SuperFrete: Cancelar etiqueta
  cancelLabel: (id: number, motivo?: string, payload?: Record<string, unknown>): Promise<ApiResponse> =>
    api.post(`/pedidos/${id}/etiqueta/cancelar`, { motivo, payload }),

  // Admin: Listar retiradas locais
  getRetiradasAdmin: (params?: {
    status?: string;
    cliente_id?: number;
    data_inicio?: string;
    data_fim?: string;
    pagina?: number;
    limite?: number;
  }): Promise<ApiResponse> => api.get('/pedidos/admin/retiradas', { params }),

  // Admin: Confirmar retirada
  confirmarRetirada: (id: number, data: {
    codigo: string;
    nome_retirada: string;
    observacao?: string;
  }): Promise<ApiResponse> => api.post(`/pedidos/${id}/confirmar-retirada`, data),

  // Admin: Historico de retirada
  getRetiradaHistorico: (id: number): Promise<ApiResponse> => api.get(`/pedidos/admin/retiradas/${id}/historico`),

  // Admin: Fila de reembolsos pendentes
  getReembolsosAdmin: (): Promise<ApiResponse> => api.get('/pedidos/admin/reembolsos'),

  // Admin: Processar reembolso manual no Asaas
  processarReembolsoAdmin: (id: number, data?: { valor?: number; descricao?: string }): Promise<ApiResponse> =>
    api.post(`/pedidos/${id}/reembolso`, data || {}),
};

// ==================== DEVOLUCOES ====================
export const returnService = {
  create: (data: FormData | Record<string, unknown>): Promise<ApiResponse> => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return api.post('/devolucoes', data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : undefined);
  },

  getAll: (params?: { status?: string; pedido_id?: number; pagina?: number; limite?: number }): Promise<ApiResponse> => 
    api.get('/devolucoes', { params }),

  getById: (id: number): Promise<ApiResponse> => api.get(`/devolucoes/${id}`),

  updateStatus: (id: number, status: string, admin_decisao?: string, admin_instrucoes?: string): Promise<ApiResponse> =>
    api.patch(`/devolucoes/${id}/status`, { status, admin_decisao, admin_instrucoes }),

  appeal: (id: number, justificativa: string): Promise<ApiResponse> =>
    api.post(`/devolucoes/${id}/recorrer`, { justificativa }),
};

// ==================== FRETE (SUPERFRETE) ====================
export const shippingService = {
  calculate: (data: {
    cep_destino: string;
    valor_declarado?: number;
    subtotal?: number;
    peso?: number;
    altura?: number;
    largura?: number;
    comprimento?: number;
    payload?: Record<string, unknown>;
    itens?: Array<{ // Itens do carrinho para cálculo automático de volumes
      produto_id: number;
      quantidade: number;
      tipo_produto_id?: number | null;
    }>;
  }): Promise<ApiResponse> => api.post('/superfrete/calcular', data),
  packagesInfo: (): Promise<ApiResponse> => api.get('/superfrete/pacotes'),
};

// ==================== AVALIAÇÕES ====================
export const reviewService = {
  // Listar avaliações de um produto
  getByProduct: (productId: number, params?: {
    ordem?: 'recente' | 'maior_nota' | 'menor_nota';
    pagina?: number;
    limite?: number;
  }): Promise<ApiResponse> => api.get(`/produtos/${productId}/avaliacoes`, { params }),
  
  // Criar avaliação
  create: (productId: number, data: { nota: number }): Promise<ApiResponse> => 
    api.post(`/produtos/${productId}/avaliacoes`, data),
  
  // Atualizar avaliação
  update: (id: number, data: { nota: number }): Promise<ApiResponse> => 
    api.put(`/avaliacoes/${id}`, data),
  
  // Deletar avaliação
  delete: (id: number): Promise<ApiResponse> => api.delete(`/avaliacoes/${id}`),
};

// ==================== COMENTÁRIOS ====================
export const commentService = {
  // Listar comentários de um produto
  getByProduct: (productId: number, params?: {
    ordem?: 'recente' | 'mais_uteis';
    pagina?: number;
    limite?: number;
  }): Promise<ApiResponse> => api.get(`/produtos/${productId}/comentarios`, { params }),
  
  // Adicionar comentário
  create: (productId: number, data: { texto: string }): Promise<ApiResponse> => 
    api.post(`/produtos/${productId}/comentarios`, data),
  
  // Marcar comentário como útil
  markUseful: (id: number): Promise<ApiResponse> => api.post(`/comentarios/${id}/util`),
};

// ==================== CUPONS ====================
export const couponService = {
  validate: (codigo: string, subtotal: number): Promise<ApiResponse> =>
    api.post('/cupons/validar', { codigo, subtotal }),
  
  // Admin: Gerenciar cupons
  getAll: (params?: { ativo?: boolean }): Promise<ApiResponse> => api.get('/cupons', { params }),
  create: (data: {
    codigo: string;
    descricao?: string;
    tipo_desconto: 'percentual' | 'fixo';
    valor_desconto: number;
    valor_minimo?: number;
    data_validade?: string;
    usos_maximos?: number;
    ativo?: boolean;
  }): Promise<ApiResponse> => api.post('/cupons', data),
  update: (id: number, data: Record<string, unknown>): Promise<ApiResponse> => api.put(`/cupons/${id}`, data),
  delete: (id: number): Promise<ApiResponse> => api.delete(`/cupons/${id}`),
};

// ==================== USUÁRIOS ====================
export const userService = {
  // Admin: Listar todos os usuários
  getAll: (params?: { pagina?: number; limite?: number }): Promise<ApiResponse> => 
    api.get('/usuarios', { params }),
  
  // Admin: Obter usuário específico
  getById: (id: number): Promise<ApiResponse> => api.get(`/usuarios/${id}`),
  
  // Admin: Alternar permissão de admin
  toggleAdmin: (id: number): Promise<ApiResponse> => api.patch(`/usuarios/${id}/admin`),

  // Admin: Deletar usuário comum
  delete: (id: number): Promise<ApiResponse> => api.delete(`/usuarios/${id}`),
};

// ==================== NEWSLETTER ====================
export const newsletterService = {
  subscribe: (email: string): Promise<ApiResponse> => api.post('/newsletter', { email }),
};

// ==================== BADGES ====================
export const badgeService = {
  // Listar todos os badges
  getAll: (): Promise<ApiResponse> => api.get('/badges'),
  
  // Obter badge específico
  getById: (id: number): Promise<ApiResponse> => api.get(`/badges/${id}`),
  
  // Listar badges de um produto
  getByProduct: (productId: number): Promise<ApiResponse> => api.get(`/badges/produtos/${productId}/badges`),
  
  // Admin: Criar badge
  create: (data: {
    nome: string;
    tipo: 'best_seller' | 'mais_vendido' | 'novo' | 'limitado';
    cor?: string;
    icone?: string;
  }): Promise<ApiResponse> => api.post('/badges', data),
  
  // Admin: Atualizar badge
  update: (id: number, data: Record<string, unknown>): Promise<ApiResponse> => api.put(`/badges/${id}`, data),
  
  // Admin: Deletar badge
  delete: (id: number): Promise<ApiResponse> => api.delete(`/badges/${id}`),
  
  // Admin: Adicionar badge a produto
  addToProduct: (productId: number, badgeId: number): Promise<ApiResponse> => 
    api.post(`/badges/produtos/${productId}/badges`, { badge_id: badgeId }),
  
  // Admin: Remover badge de produto
  removeFromProduct: (productId: number, badgeId: number): Promise<ApiResponse> => 
    api.delete(`/badges/produtos/${productId}/badges/${badgeId}`),
};

// ==================== PROMOÇÕES ====================
export const promocaoService = {
  // Listar promoções
  getAll: (params?: { ativa?: boolean }): Promise<ApiResponse> => api.get('/promocoes', { params }),
  
  // Listar promoções vigentes
  getVigentes: (): Promise<ApiResponse> => api.get('/promocoes/vigentes'),
  
  // Obter promoção específica
  getById: (id: number): Promise<ApiResponse> => api.get(`/promocoes/${id}`),
  
  // Verificar promoções aplicáveis a um produto
  getByProduct: (productId: number): Promise<ApiResponse> => 
    api.get(`/promocoes/produtos/${productId}`),
  
  // Admin: Criar promoção
  create: (data: {
    nome: string;
    descricao?: string;
    tipo_desconto: 'percentual' | 'valor_fixo';
    desconto_percentual?: number;
    desconto_valor?: number;
    data_inicio: string;
    data_fim: string;
    produtos_aplicaveis?: number[];
    ativa?: boolean;
  }): Promise<ApiResponse> => api.post('/promocoes', data),
  
  // Admin: Atualizar promoção
  update: (id: number, data: Record<string, unknown>): Promise<ApiResponse> => api.put(`/promocoes/${id}`, data),
  
  // Admin: Deletar promoção
  delete: (id: number): Promise<ApiResponse> => api.delete(`/promocoes/${id}`),
  
  // Admin: Ativar/desativar promoção
  toggle: (id: number): Promise<ApiResponse> => api.patch(`/promocoes/${id}/ativar`),
};

// ==================== CARRINHO ====================
export const carrinhoService = {
  // Obter carrinho do usuário
  get: (): Promise<ApiResponse> => api.get('/carrinho'),
  
  // Adicionar item ao carrinho
  addItem: (data: {
    produto_id: number;
    quantidade: number;
    tamanho?: string;
    cor?: string;
  }): Promise<ApiResponse> => api.post('/carrinho', data),
  
  // Atualizar quantidade de item
  updateItem: (id: number, quantidade: number): Promise<ApiResponse> => 
    api.put(`/carrinho/${id}`, { quantidade }),
  
  // Remover item do carrinho
  removeItem: (id: number): Promise<ApiResponse> => api.delete(`/carrinho/${id}`),
  
  // Limpar carrinho
  clear: (): Promise<ApiResponse> => api.delete('/carrinho'),
  
  // Sincronizar carrinho do localStorage com o banco
  sync: (itens: Array<{
    produto_id: number;
    quantidade: number;
    tamanho?: string;
    cor?: string;
  }>): Promise<ApiResponse> => api.post('/carrinho/sincronizar', { itens }),
};

// ==================== BANNERS ====================
export const bannerService = {
  // Listar todos os banners (público)
  getAll: (ativos_apenas?: boolean): Promise<ApiResponse> => 
    api.get('/banners', { params: { ativos_apenas } }),
  
  // Obter banner específico
  getById: (id: number): Promise<ApiResponse> => api.get(`/banners/${id}`),
  
  // Admin: Criar banner
  create: (data: {
    titulo: string;
    subtitulo?: string;
    texto_botao?: string;
    link_botao?: string;
    imagem?: string;
    cor_fundo?: string;
    ordem?: number;
    ativo?: boolean;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<ApiResponse> => api.post('/banners', data),
  
  // Admin: Atualizar banner
  update: (id: number, data: Record<string, unknown>): Promise<ApiResponse> => api.put(`/banners/${id}`, data),
  
  // Admin: Deletar banner
  delete: (id: number): Promise<ApiResponse> => api.delete(`/banners/${id}`),
  
  // Admin: Alternar status (ativo/inativo)
  toggle: (id: number): Promise<ApiResponse> => api.patch(`/banners/${id}/toggle`),
  
  // Admin: Reordenar banners
  reorder: (banners: Array<{ id: number; ordem: number }>): Promise<ApiResponse> => 
    api.patch('/banners/reordenar', { banners }),
};

// ==================== NOTIFICACOES ====================
export const notificationService = {
  list: (params?: { pagina?: number; limite?: number }): Promise<ApiResponse> =>
    api.get('/notificacoes', { params }),
  unread: (): Promise<ApiResponse> => api.get('/notificacoes/nao-lidas'),
  markRead: (id: number): Promise<ApiResponse> => api.post(`/notificacoes/${id}/ler`),
  markAllRead: (): Promise<ApiResponse> => api.post('/notificacoes/ler-todas'),
  remove: (id: number): Promise<ApiResponse> => api.delete(`/notificacoes/${id}`),
};

// ==================== CAIXAS CATALOGO ====================
export const caixaService = {
  getAll: (params?: { tamanho?: 'P' | 'M' | 'G'; ativo?: boolean }): Promise<ApiResponse> =>
    api.get('/admin/caixas-catalogo', { params }),
  getById: (id: number): Promise<ApiResponse> => api.get(`/admin/caixas-catalogo/${id}`),
  checkUsage: (id: number): Promise<ApiResponse> => api.get(`/admin/caixas-catalogo/${id}/uso`),
  create: (data: {
    codigo: string;
    nome: string;
    tamanho: 'P' | 'M' | 'G';
    altura: number;
    largura: number;
    comprimento: number;
    peso_caixa: number;
  }): Promise<ApiResponse> => api.post('/admin/caixas-catalogo', data),
  update: (id: number, data: { nome?: string; ativo?: boolean }): Promise<ApiResponse> => 
    api.put(`/admin/caixas-catalogo/${id}`, data),
  deactivate: (id: number): Promise<ApiResponse> => 
    api.patch(`/admin/caixas-catalogo/${id}/desativar`),
};

// ==================== CONFIG FRETE ====================
export const configFreteService = {
  getFallback: (): Promise<ApiResponse> => api.get('/admin/config-frete/fallback'),
  updateFallback: (data: {
    P: { caixa_id: number; capacidade_media: number; peso_medio_item: number };
    M: { caixa_id: number; capacidade_media: number; peso_medio_item: number };
    G: { caixa_id: number; capacidade_media: number; peso_medio_item: number };
  }): Promise<ApiResponse> => api.put('/admin/config-frete/fallback', data),
};

// ==================== TIPOS PRODUTO ====================
export const tipoProdutoService = {
  getAll: (params?: { ativo?: boolean }): Promise<ApiResponse> =>
    api.get('/admin/tipos-produto', { params }),
  getById: (id: number): Promise<ApiResponse> => api.get(`/admin/tipos-produto/${id}`),
  create: (data: { nome: string; codigo: string }): Promise<ApiResponse> =>
    api.post('/admin/tipos-produto', data),
  update: (id: number, data: { nome?: string; ativo?: boolean }): Promise<ApiResponse> =>
    api.put(`/admin/tipos-produto/${id}`, data),
  getEmbalagem: (id: number): Promise<ApiResponse> =>
    api.get(`/admin/tipos-produto/${id}/embalagem`),
  updateEmbalagem: (id: number, data: {
    P: { caixa_id: number; capacidade: number; peso_medio_item: number; observacoes?: string };
    M: { caixa_id: number; capacidade: number; peso_medio_item: number; observacoes?: string };
    G: { caixa_id: number; capacidade: number; peso_medio_item: number; observacoes?: string };
  }): Promise<ApiResponse> => api.put(`/admin/tipos-produto/${id}/embalagem`, data),
  duplicateEmbalagem: (id: number, tipoOrigemId: number): Promise<ApiResponse> =>
    api.post(`/admin/tipos-produto/${id}/embalagem/duplicar`, { tipo_origem_id: tipoOrigemId }),
};

// ==================== CONTEUDO INSTITUCIONAL ====================
export const institutionalContentService = {
  getAllPublic: (): Promise<ApiResponse> => api.get('/conteudo-institucional'),
  getBySlug: (slug: string): Promise<ApiResponse> => api.get(`/conteudo-institucional/${slug}`),

  getAllAdmin: (): Promise<ApiResponse> => api.get('/admin/conteudo-institucional'),
  getBySlugAdmin: (slug: string): Promise<ApiResponse> => api.get(`/admin/conteudo-institucional/${slug}`),
  upsert: (
    slug: string,
    data: {
      titulo: string;
      resumo?: string;
      conteudo_html?: string;
      ativo?: boolean;
      ordem?: number;
    }
  ): Promise<ApiResponse> => api.put(`/admin/conteudo-institucional/${slug}`, data),
};

// ==================== HEALTH CHECK ====================
export const healthService = {
  check: (): Promise<ApiResponse> => api.get('/health'),
  checkDatabase: (): Promise<ApiResponse> => api.get('/health/database'),
};

export default api;
