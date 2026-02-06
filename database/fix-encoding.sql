-- Script para corrigir encoding UTF-8 no PostgreSQL
-- Execute este script no banco de dados point55

-- 1. Verificar encoding atual do banco
SELECT 
    datname, 
    pg_encoding_to_char(encoding) as encoding,
    datcollate,
    datctype
FROM pg_database 
WHERE datname = 'point55';

-- 2. Remover caracteres nulos dos produtos
UPDATE produtos 
SET 
    nome = REPLACE(nome, E'\0', ''),
    descricao = REPLACE(REPLACE(descricao, E'\0', ''), E'\\0', ''),
    slug = REPLACE(slug, E'\0', '')
WHERE 
    nome LIKE '%' || E'\0' || '%' OR
    descricao LIKE '%' || E'\0' || '%' OR
    slug LIKE '%' || E'\0' || '%';

-- 3. Remover caracteres nulos das categorias
UPDATE categorias 
SET 
    nome = REPLACE(nome, E'\0', ''),
    descricao = REPLACE(descricao, E'\0', ''),
    slug = REPLACE(slug, E'\0', '')
WHERE 
    nome LIKE '%' || E'\0' || '%' OR
    descricao LIKE '%' || E'\0' || '%' OR
    slug LIKE '%' || E'\0' || '%';

-- 4. Verificar produtos com problemas de encoding
SELECT 
    id, 
    nome,
    categoria_id,
    LENGTH(nome) as tamanho,
    OCTET_LENGTH(nome) as bytes
FROM produtos
WHERE 
    nome ~ '[À-ÿ]{2,}' OR  -- caracteres duplicados
    nome LIKE '%Ã%' OR     -- caractere mal codificado
    nome LIKE '%â%' OR
    nome LIKE '%ç%' OR
    nome LIKE '%\0%'
ORDER BY id
LIMIT 20;

-- 5. Listar todas as categorias
SELECT id, nome, slug FROM categorias ORDER BY id;

-- 6. Estatísticas
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN desconto_percentual > 0 THEN 1 END) as produtos_promocao,
    COUNT(CASE WHEN ativo = true THEN 1 END) as produtos_ativos
FROM produtos;

-- 7. Produtos de exemplo (primeiros 10)
SELECT 
    id, 
    nome, 
    preco, 
    desconto_percentual,
    categoria_id
FROM produtos 
WHERE ativo = true
ORDER BY id 
LIMIT 10;
