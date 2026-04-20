BEGIN;

-- Normaliza estoque por cor removendo sufixo de percentual (ex: PRETO@70 -> PRETO)
WITH normalized AS (
  SELECT
    p.id,
    COALESCE(
      (
        SELECT jsonb_object_agg(k, to_jsonb(qty))
        FROM (
          SELECT
            UPPER(
              REGEXP_REPLACE(
                TRIM(BOTH FROM key),
                '@\s*[0-9]{1,3}\s*%?$',
                '',
                'i'
              )
            ) AS k,
            SUM(COALESCE((value #>> '{}')::int, 0))::int AS qty
          FROM jsonb_each(COALESCE(p.estoque_cores, '{}'::jsonb))
          GROUP BY 1
        ) grouped
      ),
      '{}'::jsonb
    ) AS estoque_cores_normalizado
  FROM produtos p
)
UPDATE produtos p
SET estoque_cores = n.estoque_cores_normalizado
FROM normalized n
WHERE p.id = n.id;

-- Normaliza estoque por variação removendo sufixo de percentual na parte da cor
WITH normalized AS (
  SELECT
    p.id,
    COALESCE(
      (
        SELECT jsonb_object_agg(k, to_jsonb(qty))
        FROM (
          SELECT
            CONCAT(
              UPPER(TRIM(BOTH FROM split_part(key, '|', 1))),
              '|',
              UPPER(
                REGEXP_REPLACE(
                  TRIM(BOTH FROM split_part(key, '|', 2)),
                  '@\s*[0-9]{1,3}\s*%?$',
                  '',
                  'i'
                )
              )
            ) AS k,
            SUM(COALESCE((value #>> '{}')::int, 0))::int AS qty
          FROM jsonb_each(COALESCE(p.estoque_variantes, '{}'::jsonb))
          GROUP BY 1
        ) grouped
      ),
      '{}'::jsonb
    ) AS estoque_variantes_normalizado
  FROM produtos p
)
UPDATE produtos p
SET estoque_variantes = n.estoque_variantes_normalizado
FROM normalized n
WHERE p.id = n.id;

COMMIT;
