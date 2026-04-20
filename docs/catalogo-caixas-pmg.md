# Catalogo Global de Caixas P/M/G

## Objetivo
Definir um conjunto padrao de caixas (Pequena, Media, Grande) com medidas fixas que o admin seleciona ao configurar tipos de produto, eliminando a necessidade de cadastrar medidas manualmente.

---

## Estrutura de Dados

### Tabela: `caixas_catalogo`
```sql
CREATE TABLE caixas_catalogo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(10) NOT NULL UNIQUE,  -- Ex: 'P1', 'M2', 'G3'
  nome VARCHAR(100) NOT NULL,           -- Ex: 'Pequena 1', 'Media 2', 'Grande 3'
  tamanho ENUM('P', 'M', 'G') NOT NULL, -- Categoria da caixa
  altura DECIMAL(10,2) NOT NULL,        -- Em cm
  largura DECIMAL(10,2) NOT NULL,       -- Em cm
  comprimento DECIMAL(10,2) NOT NULL,   -- Em cm
  peso_caixa DECIMAL(10,3) NOT NULL,    -- Peso da caixa vazia em kg
  ativo BOOLEAN DEFAULT TRUE,           -- Se pode ser selecionada
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Campos Detalhados

| Campo | Tipo | Obrigatorio | Descricao | Validacao |
|-------|------|-------------|-----------|-----------|
| `id` | INT | Sim | Identificador unico | Auto incremento |
| `codigo` | VARCHAR(10) | Sim | Codigo curto (P1, M2, G3) | Unico, 2-10 caracteres |
| `nome` | VARCHAR(100) | Sim | Nome descritivo | 3-100 caracteres |
| `tamanho` | ENUM | Sim | Categoria P/M/G | P, M ou G |
| `altura` | DECIMAL(10,2) | Sim | Altura em cm | > 0, max 200 |
| `largura` | DECIMAL(10,2) | Sim | Largura em cm | > 0, max 200 |
| `comprimento` | DECIMAL(10,2) | Sim | Comprimento em cm | > 0, max 200 |
| `peso_caixa` | DECIMAL(10,3) | Sim | Peso vazio em kg | >= 0, max 50 |
| `ativo` | BOOLEAN | Sim | Disponivel para uso | true/false |

---

## Validacoes

### Ao Criar/Editar Caixa
1. **Codigo**: unico, apenas letras e numeros, 2-10 caracteres.
2. **Nome**: obrigatorio, 3-100 caracteres.
3. **Tamanho**: deve ser P, M ou G.
4. **Dimensoes**: altura, largura, comprimento > 0 e <= 200 cm.
5. **Peso caixa**: >= 0 e <= 50 kg.
6. **Consistencia de tamanho**: caixas G devem ter volume > M > P (validacao opcional, mas recomendada).

### Ao Desativar Caixa
1. Verificar se nenhuma configuracao de tipo de produto esta usando a caixa.
2. Se estiver em uso, exibir alerta e sugerir substituicao antes de desativar.

### Ao Excluir Caixa
1. Nao permitir exclusao se estiver vinculada a alguma configuracao de tipo.
2. Apenas desativacao e permitida.

---

## Caixas Padrao (Seed Inicial)

```sql
INSERT INTO caixas_catalogo (codigo, nome, tamanho, altura, largura, comprimento, peso_caixa) VALUES
-- Pequenas
('P1', 'Pequena 1', 'P', 10, 15, 20, 0.1),
('P2', 'Pequena 2', 'P', 12, 18, 22, 0.15),
('P3', 'Pequena 3', 'P', 15, 20, 25, 0.2),

-- Medias
('M1', 'Media 1', 'M', 20, 25, 30, 0.3),
('M2', 'Media 2', 'M', 25, 30, 35, 0.4),
('M3', 'Media 3', 'M', 30, 35, 40, 0.5),

-- Grandes
('G1', 'Grande 1', 'G', 35, 40, 45, 0.6),
('G2', 'Grande 2', 'G', 40, 45, 50, 0.7),
('G3', 'Grande 3', 'G', 50, 55, 60, 0.9);
```

---

## Fluxo no Admin

### Tela: "Catalogo de Caixas"
1. **Listagem**: tabela com caixas ordenadas por tamanho (P → M → G) e codigo.
2. **Colunas**: codigo, nome, tamanho, dimensoes (AxLxC), peso, ativo, acoes.
3. **Filtros**: tamanho (P/M/G), status (ativo/inativo).
4. **Acoes**: editar, desativar/ativar, visualizar uso.

### Formulario: "Adicionar/Editar Caixa"
```
Codigo:        [____] (2-10 caracteres, unico)
Nome:          [___________________________] (3-100 caracteres)
Tamanho:       ( ) P  ( ) M  ( ) G
Altura (cm):   [____] (> 0, max 200)
Largura (cm):  [____] (> 0, max 200)
Comprimento (cm): [____] (> 0, max 200)
Peso caixa (kg): [____] (>= 0, max 50)
Ativo:         [x] Disponivel para uso

[Salvar] [Cancelar]
```

### Validacoes no Formulario
- Codigo: formato alfanumerico, unico.
- Dimensoes: numeros positivos, max 200 cm.
- Peso: numeros >= 0, max 50 kg.
- Consistencia de volume: avisar se volume for inconsistente com tamanho (P/M/G).

---

## Uso na Configuracao de Tipos

### Exemplo de Selecao
Ao configurar "Tenis":
```
Linha P:  Caixa [P2 - Pequena 2 (12x18x22 cm)] | Capacidade: [1] item(s) | Peso/item: [0.9] kg
Linha M:  Caixa [M1 - Media 1 (20x25x30 cm)]   | Capacidade: [2] item(s) | Peso/item: [0.9] kg
Linha G:  Caixa [G1 - Grande 1 (35x40x45 cm)]  | Capacidade: [4] item(s) | Peso/item: [0.9] kg
```

O admin seleciona as caixas de dropdowns que exibem apenas caixas ativas.

---

## Endpoints da API

### Listar Caixas
```
GET /api/admin/caixas-catalogo
Query params: ?tamanho=P&ativo=true
Response: { caixas: [...] }
```

### Obter Caixa
```
GET /api/admin/caixas-catalogo/:id
Response: { id, codigo, nome, tamanho, altura, largura, comprimento, peso_caixa, ativo }
```

### Criar Caixa
```
POST /api/admin/caixas-catalogo
Body: { codigo, nome, tamanho, altura, largura, comprimento, peso_caixa }
Response: { id, ... }
```

### Editar Caixa
```
PUT /api/admin/caixas-catalogo/:id
Body: { nome?, altura?, largura?, comprimento?, peso_caixa?, ativo? }
Response: { id, ... }
```

### Desativar Caixa
```
PATCH /api/admin/caixas-catalogo/:id/desativar
Response: { success: true }
```

### Verificar Uso
```
GET /api/admin/caixas-catalogo/:id/uso
Response: { em_uso: true, tipos_vinculados: [...] }
```

---

## Regras de Negocio

1. **Caixas ativas**: apenas caixas ativas aparecem nos dropdowns de configuracao.
2. **Desativacao**: ao desativar, verificar se nenhuma config de tipo esta usando; se sim, bloquear ou avisar.
3. **Exclusao**: nao permitir exclusao se estiver vinculada a alguma config.
4. **Ordenacao**: ao listar, ordenar por tamanho (P → M → G) e depois por codigo.
5. **Volume**: calcular volume = altura * largura * comprimento (opcional, para validacao de consistencia).

---

## Configuracao Fallback Global

### Objetivo
Definir caixas e capacidades padrao (P/M/G) para tipos de produto que nao tiverem configuracao especifica.

### Estrutura de Dados

```sql
CREATE TABLE config_fallback_frete (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tamanho ENUM('P', 'M', 'G') NOT NULL UNIQUE,
  caixa_id INT NOT NULL,
  capacidade_media INT NOT NULL,
  peso_medio_item DECIMAL(10,3) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (caixa_id) REFERENCES caixas_catalogo(id)
);
```

### Tela: "Configuracao Fallback"

```
Configuracao Padrao para Tipos Sem Regras Especificas

Linha P:  Caixa [P2 - Pequena 2 (12x18x22 cm)] | Capacidade: [1] item(s) | Peso/item: [0.5] kg
Linha M:  Caixa [M1 - Media 1 (20x25x30 cm)]   | Capacidade: [3] item(s) | Peso/item: [0.5] kg
Linha G:  Caixa [G1 - Grande 1 (35x40x45 cm)]  | Capacidade: [6] item(s) | Peso/item: [0.5] kg

[Salvar Configuracao]
```

### Endpoints

```
GET /api/admin/config-fallback-frete
Response: { P: {...}, M: {...}, G: {...} }

PUT /api/admin/config-fallback-frete
Body: { 
  P: { caixa_id, capacidade_media, peso_medio_item },
  M: { caixa_id, capacidade_media, peso_medio_item },
  G: { caixa_id, capacidade_media, peso_medio_item }
}
```

### Seed Inicial

```sql
INSERT INTO config_fallback_frete (tamanho, caixa_id, capacidade_media, peso_medio_item) VALUES
('P', 1, 1, 0.5),  -- P1, 1 item, 0.5 kg
('M', 4, 3, 0.5),  -- M1, 3 itens, 0.5 kg
('G', 7, 6, 0.5);  -- G1, 6 itens, 0.5 kg
```

---

## Proximos Passos

1. Criar tabelas `caixas_catalogo` e `config_fallback_frete` e inserir seeds iniciais.
2. Implementar endpoints CRUD de caixas e config fallback.
3. Criar tela no admin para gerenciar catalogo e fallback.
4. Integrar selecao de caixas na tela de configuracao de tipos.
5. Validar desativacao e uso antes de permitir alteracoes.
6. Implementar algoritmo de empacotamento que usa fallback quando tipo nao tem config.
