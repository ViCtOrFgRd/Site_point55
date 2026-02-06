export interface Product {
  id: number;
  nome: string;
  descricao: string;
  preco: number | string; // PostgreSQL DECIMAL retorna como string
  preco_original?: number | string;
  desconto_percentual?: number;
  categoria_id: number;
  estoque: number;
  imagens: string[];
  cores_disponiveis?: string[];
  tamanhos_disponiveis?: string[];
  ativo: boolean;
  vendas_total: number;
  data_criacao: string;
  data_atualizacao: string;
  badges?: Badge[];
  avaliacoes?: Avaliacao[];
  media_avaliacoes?: number;
}

export interface Category {
  id: number;
  nome: string;
  slug: string;
  imagem?: string;
  ordem: number;
  ativa: boolean;
  data_criacao: string;
}

export interface Badge {
  id: number;
  nome: string;
  tipo: 'best_seller' | 'mais_vendido' | 'novo' | 'limitado';
  cor: string;
  icone?: string;
}

export interface Avaliacao {
  id: number;
  produto_id: number;
  usuario_id: number;
  nota: number;
  data_avaliacao: string;
  verificado_compra: boolean;
  ativo: boolean;
  usuario?: {
    nome: string;
  };
}

export interface Comentario {
  id: number;
  produto_id: number;
  usuario_id: number;
  usuario_nome?: string;
  texto: string;
  nota?: number; // 1-5
  data_comentario: string;
  data_criacao: string; // Alias para data_comentario
  curtidas: number;
  votos_uteis: number; // Alias para curtidas
  verificado_compra: boolean;
  ativo: boolean;
  usuario?: {
    nome: string;
  };
}

export interface CartItem {
  produto: Product;
  quantidade: number;
  tamanho?: string;
  cor?: string;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  data_cadastro: string;
  ativo: boolean;
  is_admin: boolean;
}

export interface Pedido {
  id: number;
  usuario_id: number;
  status: 'pendente' | 'pago' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
  forma_pagamento: 'cartao' | 'pix' | 'boleto';
  codigo_rastreio?: string;
  data_pedido: string;
  data_atualizacao: string;
  itens?: ItemPedido[];
}

export interface ItemPedido {
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  tamanho?: string;
  cor?: string;
  produto?: Product;
}
