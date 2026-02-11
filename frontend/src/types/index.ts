export interface Product {
  id: number;
  nome: string;
  descricao: string;
  preco: number | string; // PostgreSQL DECIMAL retorna como string
  preco_pix?: number | string;
  preco_debito?: number | string;
  preco_credito?: number | string;
  preco_boleto?: number | string;
  parcelas_maximas?: number | string;
  preco_original?: number | string;
  desconto_percentual?: number;
  categoria_id: number;
  categoria_ids?: number[];
  categoria_nomes?: string[];
  categoria_slugs?: string[];
  categoria_nome?: string;
  estoque: number;
  imagens: string[];
  imagem_url?: string;
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
  id?: number;
  produto_id?: number;
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
  status: 'pendente' | 'pago' | 'processando' | 'enviado' | 'devolucao' | 'devolvido' | 'entregue' | 'cancelado';
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

export interface DevolucaoItem {
  id: number;
  devolucao_id: number;
  pedido_item_id: number;
  produto_id: number;
  quantidade: number;
  tamanho?: string;
  cor?: string;
  motivo_item?: string;
  produto_nome?: string;
}

export interface DevolucaoAnexo {
  id: number;
  devolucao_id: number;
  arquivo_url: string;
  arquivo_nome?: string;
  data_criacao: string;
}

export interface Devolucao {
  id: number;
  usuario_id: number;
  pedido_id: number;
  tipo: 'troca' | 'devolucao';
  status: 'solicitado' | 'em_analise' | 'aprovado' | 'recusado' | 'recorre' | 'concluido';
  motivo: string;
  justificativa: string;
  observacoes?: string;
  admin_decisao?: string;
  admin_instrucoes?: string;
  justificativa_recorrencia?: string;
  data_recorrencia?: string;
  data_criacao: string;
  data_atualizacao: string;
  usuario_nome?: string;
  usuario_email?: string;
  pedido_status?: string;
  itens?: DevolucaoItem[];
  anexos?: DevolucaoAnexo[];
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
