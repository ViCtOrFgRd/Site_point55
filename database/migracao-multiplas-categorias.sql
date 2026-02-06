-- Script de Migração: Adicionar suporte a múltiplas categorias por produto
-- Execute este script para migrar o banco de dados

-- Passo 1: Criar tabela de junção produto_categorias
CREATE TABLE IF NOT EXISTS produto_categorias (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(produto_id, categoria_id)
);

-- Passo 2: Migrar dados existentes de categoria_id para a tabela de junção
INSERT INTO produto_categorias (produto_id, categoria_id)
SELECT id, categoria_id 
FROM produtos 
WHERE categoria_id IS NOT NULL 
ON CONFLICT (produto_id, categoria_id) DO NOTHING;

-- Passo 3: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_produto_categorias_produto_id ON produto_categorias(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_categorias_categoria_id ON produto_categorias(categoria_id);

-- Passo 4: View auxiliar para compatibilidade com código antigo
CREATE OR REPLACE VIEW produtos_com_categorias AS
SELECT 
    p.*,
    ARRAY_AGG(DISTINCT c.id) as categoria_ids,
    ARRAY_AGG(DISTINCT c.nome) as categoria_nomes,
    ARRAY_AGG(DISTINCT c.slug) as categoria_slugs,
    STRING_AGG(DISTINCT c.nome, ', ') as categorias_texto
FROM produtos p
LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
LEFT JOIN categorias c ON pc.categoria_id = c.id
GROUP BY p.id;

-- Nota: A coluna categoria_id em produtos pode ser mantida para compatibilidade,
-- ou removida após migração completa do código
