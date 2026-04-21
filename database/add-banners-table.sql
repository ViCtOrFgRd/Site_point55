-- Script para adicionar tabela de banners
-- Execute: psql -U postgres -d point55 -f database/add-banners-table.sql

-- Tabela de Banners (Hero Slider)
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo TEXT,
    texto_botao VARCHAR(100),
    link_botao VARCHAR(255),
    imagem TEXT,
    cor_fundo VARCHAR(20) DEFAULT '#0C1C3A',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX idx_banners_ativo ON banners(ativo);
CREATE INDEX idx_banners_ordem ON banners(ordem);

-- Trigger para atualizar data_atualizacao
CREATE TRIGGER trigger_update_banners
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION update_data_atualizacao();

-- Inserir banners padrão
INSERT INTO banners (titulo, subtitulo, texto_botao, link_botao, imagem, cor_fundo, ordem, ativo) VALUES
('MEGA BAZAR', 'Até 70% OFF em peças selecionadas', 'Ver Ofertas', '/promocoes', '/images/banner1.svg', '#0C1C3A', 1, TRUE),
('NOVA COLEÇÃO', 'Primavera/Verão 2026', 'Conferir', '/produtos', '/images/banner2.svg', '#0C1C3A', 2, TRUE),
('FRETE GRÁTIS', 'Em compras acima de R$ 200', 'Aproveitar', '/produtos', '/images/banner3.svg', '#1a2a4a', 3, TRUE);

-- Mensagem de sucesso
SELECT 'Tabela de banners criada com sucesso!' as status;
SELECT COUNT(*) as total_banners FROM banners;
