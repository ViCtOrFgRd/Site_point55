SET client_encoding = 'UTF8';

-- Corrige caracteres quebrados (mojibake) em registros já gravados.
-- Aplica apenas quando há padrões típicos de encoding incorreto.

UPDATE conteudos_institucionais
SET
  titulo = convert_from(convert_to(titulo, 'LATIN1'), 'UTF8'),
  atualizado_em = NOW()
WHERE titulo ~ '(Ã.|Â.|â.|├|�)';

UPDATE conteudos_institucionais
SET
  resumo = convert_from(convert_to(resumo, 'LATIN1'), 'UTF8'),
  atualizado_em = NOW()
WHERE COALESCE(resumo, '') ~ '(Ã.|Â.|â.|├|�)';

UPDATE conteudos_institucionais
SET
  conteudo_html = convert_from(convert_to(conteudo_html, 'LATIN1'), 'UTF8'),
  atualizado_em = NOW()
WHERE COALESCE(conteudo_html, '') ~ '(Ã.|Â.|â.|├|�)';
