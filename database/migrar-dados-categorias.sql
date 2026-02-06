-- Script para Migrar Dados Existentes para produto_categorias
-- Execute este script APÓS criar a tabela produto_categorias

-- Migrar todas as categorias existentes
INSERT INTO produto_categorias (produto_id, categoria_id)
SELECT id, categoria_id 
FROM produtos 
WHERE categoria_id IS NOT NULL
ON CONFLICT (produto_id, categoria_id) DO NOTHING;

-- Verificar quantos produtos foram migrados
SELECT COUNT(*) as produtos_migrados FROM produto_categorias;

-- Verificar produtos que agora têm categorias
SELECT COUNT(DISTINCT p.id) as produtos_com_categorias
FROM produtos p
WHERE EXISTS (SELECT 1 FROM produto_categorias WHERE produto_id = p.id);

-- Listar exemplos de produtos migrados
SELECT 
  p.id,
  p.nome,
  p.categoria_id as categoria_principal,
  ARRAY_AGG(pc.categoria_id) as todas_categorias
FROM produtos p
LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
WHERE p.categoria_id IS NOT NULL
GROUP BY p.id
LIMIT 10;
