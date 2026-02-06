-- Criação do banco de dados Point55
-- Execute este script para criar todas as tabelas necessárias

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    imagem TEXT,
    ordem INTEGER DEFAULT 0,
    ativa BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    preco_original DECIMAL(10, 2),
    desconto_percentual INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    estoque INTEGER DEFAULT 0,
    imagens TEXT[], -- Array de URLs das imagens
    cores_disponiveis TEXT[], -- Array de cores
    tamanhos_disponiveis TEXT[], -- Array de tamanhos (P, M, G, GG)
    ativo BOOLEAN DEFAULT TRUE,
    vendas_total INTEGER DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Tabela de Endereços
CREATE TABLE IF NOT EXISTS enderecos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    cep VARCHAR(10) NOT NULL,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    is_principal BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, pago, processando, enviado, entregue, cancelado
    subtotal DECIMAL(10, 2) NOT NULL,
    desconto DECIMAL(10, 2) DEFAULT 0,
    frete DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50), -- cartao, pix, boleto
    codigo_rastreio VARCHAR(100),
    endereco_entrega_id INTEGER REFERENCES enderecos(id),
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tamanho VARCHAR(10),
    cor VARCHAR(50)
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    nota INTEGER CHECK (nota >= 1 AND nota <= 5) NOT NULL,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verificado_compra BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    texto TEXT NOT NULL,
    data_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    curtidas INTEGER DEFAULT 0,
    verificado_compra BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Promoções
CREATE TABLE IF NOT EXISTS promocoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_desconto VARCHAR(20) NOT NULL, -- percentual, valor_fixo
    desconto_percentual INTEGER,
    desconto_valor DECIMAL(10, 2),
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    produtos_aplicaveis INTEGER[], -- Array de IDs de produtos
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Badges (Selos)
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- best_seller, mais_vendido, novo, limitado
    cor VARCHAR(20),
    icone VARCHAR(100),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos com Badges (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS produtos_badges (
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
    PRIMARY KEY (produto_id, badge_id)
);

-- Tabela de Cupons
CREATE TABLE IF NOT EXISTS cupons (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT,
    tipo_desconto VARCHAR(20) NOT NULL, -- percentual, fixo
    valor_desconto DECIMAL(10, 2) NOT NULL,
    valor_minimo DECIMAL(10, 2) DEFAULT 0,
    data_validade TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    usos_maximos INTEGER,
    usos_atuais INTEGER DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Newsletter
CREATE TABLE IF NOT EXISTS newsletter (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Carrinho (opcional, para persistência)
CREATE TABLE IF NOT EXISTS carrinho (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL,
    tamanho VARCHAR(10),
    cor VARCHAR(50),
    data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_avaliacoes_produto ON avaliacoes(produto_id);
CREATE INDEX idx_comentarios_produto ON comentarios(produto_id);
CREATE INDEX idx_promocoes_ativa ON promocoes(ativa);
CREATE INDEX idx_cupons_codigo ON cupons(codigo);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Inserir categorias padrão
INSERT INTO categorias (nome, slug, ordem) VALUES
('Roupas Femininas', 'roupas-femininas', 1),
('Roupas Masculinas', 'roupas-masculinas', 2),
('Acessórios', 'acessorios', 3),
('Calçados', 'calcados', 4),
('Promoções', 'promocoes', 5);

-- Inserir badges padrão
INSERT INTO badges (nome, tipo, cor) VALUES
('Best Seller', 'best_seller', '#FF6B6B'),
('Mais Vendido', 'mais_vendido', '#4ECDC4'),
('Novo', 'novo', '#95E1D3'),
('Edição Limitada', 'limitado', '#F38181');

-- Criar função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar data_atualizacao em produtos
CREATE TRIGGER trigger_update_produtos
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_data_atualizacao();

-- Trigger para atualizar data_atualizacao em pedidos
CREATE TRIGGER trigger_update_pedidos
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_data_atualizacao();
