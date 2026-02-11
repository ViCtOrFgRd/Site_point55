# RELATÓRIO: Análise de Vinculação de Cupons à Conta do Usuário

## 🔴 PROBLEMAS ENCONTRADOS

### 1. **Cupons NÃO estão sendo vinculados à conta do usuário**
   - **Localização**: `backend/controllers/pedidoController.js` (linhas 104-113)
   - **Problema**: O cupom é aplicado apenas incrementando `usos_atuais` globalmente
   - **Impacto**: Qualquer usuário pode usar o mesmo cupom ilimitadamente

### 2. **Falta tabela de histórico de uso de cupons por usuário**
   - **Localização**: `database/schema.sql`
   - **Problema**: Não existe tabela para registrar qual cupom foi usado por qual usuário
   - **Resultado**: Impossível verificar se um usuário já utilizou um cupom específico

### 3. **Validação insuficiente ao aplicar cupom**
   - **Localização**: `backend/controllers/pedidoController.js`
   - **Problema**: A validação do cupom só verifica:
     - Se o cupom existe e está ativo
     - Se a data é válida
     - Se ainda tem usos disponíveis globalmente
  - **Falta**:
    - Verificar se o usuário já usou este cupom
    - Validar `valor_minimo` do carrinho

### 4. **Valor mínimo não é aplicado**
   - **Localização**: `backend/controllers/pedidoController.js` e `/api/cupons/validar`
   - **Problema**: O campo `valor_minimo` existe no banco, mas não é usado
   - **Impacto**: Cupons podem ser aplicados em compras menores que o mínimo exigido

### 5. **Validação de cupom sem autenticação**
   - **Localização**: `backend/routes/cupons.js`
   - **Problema**: A rota `/api/cupons/validar` é pública
   - **Impacto**: Não é possível validar o reuso por usuário na etapa de validação

### 4. **Validação pública não permite checar uso por usuário**
  - **Localização**: `backend/routes/cupons.js`
  - **Problema**: A rota `/api/cupons/validar` é pública
  - **Impacto**: Não há `req.usuario`, então não dá para bloquear cupom já usado

---

## 📊 ANÁLISE TÉCNICA

### Fluxo Atual (INCORRETO):
```
Usuário A usa cupom "DESCONTO10"
  ↓
Incrementa usos_atuais de 0 para 1
  ↓
Usuário B usa cupom "DESCONTO10"
  ↓
Incrementa usos_atuais de 1 para 2
  ↓
❌ NÃO HÁ REGISTRO DE QUEM USOU!
```

### Fluxo Desejado (CORRETO):
```
Usuário A usa cupom "DESCONTO10"
  ↓
Registra em tabela: usuario_id=1, cupom_id=5
  ↓
Usuário A tenta usar cupom novamente  "DESCONTO10"
  ↓
Verifica se usuario_id=1 já utilizou no cupons_usuarios, ele diz que vou utilizado.
  ↓
✅ REJEITA  conforme política

Mas cada cupom tem sua quantidade maxima de usos, dever inclementada globalmente, e cada usuário só pode usar uma vez, quando atinge o limite global, o cupom é esgotado para todos.
```

---

## 🛠️ SOLUÇÕES NECESSÁRIAS

### **SOLUÇÃO 1: Criar Tabela de Histórico de Cupons**

Adicionar ao `database/schema.sql`:

```sql
-- Tabela de uso de cupons por usuário
CREATE TABLE IF NOT EXISTS cupons_usuarios (
    id SERIAL PRIMARY KEY,
    cupom_id INTEGER REFERENCES cupons(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
    data_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cupom_id, usuario_id) -- Cada usuário usa cada cupom apenas uma vez
);

CREATE INDEX idx_cupons_usuarios_cupom ON cupons_usuarios(cupom_id);
CREATE INDEX idx_cupons_usuarios_usuario ON cupons_usuarios(usuario_id);
```

---

### **SOLUÇÃO 2: Atualizar Validação de Cupom (login obrigatório + subtotal obrigatório)**

Modificar `backend/controllers/cupomController.js`:

```javascript
// Adicionar verificação de uso anterior
const validarCupom = async (req, res) => {
  try {
    const { codigo, subtotal } = req.body;
    const usuarioId = req.usuario.id; // Login obrigatório

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Código do cupom é obrigatório',
      });
    }

    if (subtotal === undefined || subtotal === null || Number.isNaN(parseFloat(subtotal))) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    if (subtotal === undefined || subtotal === null || Number.isNaN(parseFloat(subtotal))) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    // Buscar cupom
    const result = await pool.query(
      `SELECT * FROM cupons 
       WHERE codigo = $1 AND ativo = true`,
      [codigo.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    const cupom = result.rows[0];

    // Verificar validade
    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    // Verificar limite de uso global
    if (cupom.usos_maximos && cupom.usos_atuais >= cupom.usos_maximos) {
      return res.status(400).json({
        success: false,
        error: 'Cupom esgotado',
      });
    }

    // ✅ NOVO: Validar valor mínimo do carrinho
    const subtotalNumero = parseFloat(subtotal);
    if (!Number.isNaN(subtotalNumero) && cupom.valor_minimo && subtotalNumero < cupom.valor_minimo) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    // ✅ NOVO: Verificar se usuário já usou este cupom
    const jaUsouResult = await pool.query(
      `SELECT id FROM cupons_usuarios 
       WHERE cupom_id = $1 AND usuario_id = $2`,
      [cupom.id, usuarioId]
    );

    if (jaUsouResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ja utilizado',
      });
    }

    // Cupom válido
    res.json({
      success: true,
      message: 'Cupom válido',
      data: {
        id: cupom.id,
        codigo: cupom.codigo,
        descricao: cupom.descricao,
        tipo_desconto: cupom.tipo_desconto,
        valor_desconto: cupom.valor_desconto,
        valor_minimo: cupom.valor_minimo,
        usos_atuais: cupom.usos_atuais,
        usos_maximos: cupom.usos_maximos,
      },
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao validar cupom',
    });
  }
};
```

---

### **SOLUÇÃO 3: Registrar Uso do Cupom ao Criar Pedido**

Modificar `backend/controllers/pedidoController.js` (após linha 113):

```javascript
// Aplicar cupom se fornecido
let desconto = 0;
let cupomId = null;

if (cupom_codigo) {
  const cupomResult = await client.query(
    `SELECT * FROM cupons 
     WHERE codigo = $1 AND ativo = true`,
    [cupom_codigo.toUpperCase()]
  );

  if (cupomResult.rows.length > 0) {
    const cupom = cupomResult.rows[0];
    cupomId = cupom.id;
    
    // ✅ NOVO: Verificar se usuário já usou este cupom
    const jaUsouResult = await client.query(
      `SELECT id FROM cupons_usuarios 
       WHERE cupom_id = $1 AND usuario_id = $2`,
      [cupom.id, userId]
    );

    if (jaUsouResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Ja utilizado',
      });
    }

    // ✅ NOVO: Validar valor mínimo
    if (cupom.valor_minimo && subtotal < cupom.valor_minimo) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }
    
    if (cupom.tipo_desconto === 'percentual') {
      desconto = (subtotal * cupom.valor_desconto) / 100;
    } else {
      desconto = cupom.valor_desconto;
    }

    // Atualizar uso global do cupom e registrar uso por usuario
    await client.query(
      'UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = $1',
      [cupom.id]
    );

    await client.query(
      `INSERT INTO cupons_usuarios (cupom_id, usuario_id, pedido_id)
       VALUES ($1, $2, $3)`,
      [cupom.id, userId, pedido.id]
    );
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar tabela `cupons_usuarios` no banco de dados
- [x] Exigir autenticação na rota `/api/cupons/validar`
- [x] Atualizar `cupomController.js` com verificação de uso prévio
- [x] Atualizar `pedidoController.js` para registrar uso em `cupons_usuarios`
- [x] Validar `valor_minimo` no `validarCupom` e no fluxo do pedido
- [x] Padronizar erros: `Ja utilizado`, `Cupom invalido` e `Cupom esgotado`
- [x] Exigir `subtotal` na validação do cupom
- [x] Gravar `cupom_codigo` direto em `pedidos`
- [ ] Testar: Um usuário não pode usar o mesmo cupom duas vezes
- [ ] Testar: Diferentes usuários podem usar o mesmo cupom (até esgotar global)
- [ ] Adicionar logs para rastreamento de uso de cupons
- [x] Criar endpoint admin para visualizar histórico de cupons usados

---

## 🔒 SEGURANÇA ADICIONAL

Considere adicionar:

1. **Rate limiting** para prevenção de abuso
2. **Política de cupom por categoria** (se aplicável)
3. **Cupons com limite de uso por usuário** (ex: máximo 2 usos por usuário)

---

## 🎯 LÓGICA DE FUNCIONAMENTO FINAL

### Controle de Cupons por Usuário:

```javascript
// Cada cupom tem:
// - usos_maximos: limite GLOBAL de quantas vezes pode ser usado por TODOS os usuários
// - usos_atuais: contador que incrementa toda vez que QUALQUER usuário usa

// Exemplo:
Cupom "DESCONTO10" {
  usos_maximos: 100,    // Máximo 100 usos no total
  usos_atuais: 0        // Começará em 0
}

// Fluxo:
Usuário 1 usa "DESCONTO10"
  → INSERT cupons_usuarios (cupom_id=5, usuario_id=1, ...)
  → UPDATE cupons SET usos_atuais = 1
  
Usuário 2 usa "DESCONTO10"
  → INSERT cupons_usuarios (cupom_id=5, usuario_id=2, ...)
  → UPDATE cupons SET usos_atuais = 2

Usuário 1 tenta usar novamente "DESCONTO10"
  → SELECT * FROM cupons_usuarios WHERE cupom_id=5 AND usuario_id=1
  → ❌ REJEITA: "Ja utilizado"

Carrinho abaixo do valor mínimo
  → ❌ REJEITA: "Cupom invalido"
  
Quando usos_atuais = 100
  → ❌ REJEITA para TODOS: "Cupom esgotado"
```

---

## 📝 IMPLEMENTAÇÃO PASSO A PASSO

### PASSO 1: Migração do Banco de Dados

Criar arquivo `backend/migrations/002-add-cupons-usuarios.sql`:

```sql
-- Tabela de uso de cupons por usuário
CREATE TABLE IF NOT EXISTS cupons_usuarios (
    id SERIAL PRIMARY KEY,
    cupom_id INTEGER NOT NULL REFERENCES cupons(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
    data_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cupom_id, usuario_id) -- Garante que cada usuário use cada cupom apenas uma vez
);

-- Índices para performance
CREATE INDEX idx_cupons_usuarios_cupom ON cupons_usuarios(cupom_id);
CREATE INDEX idx_cupons_usuarios_usuario ON cupons_usuarios(usuario_id);
CREATE INDEX idx_cupons_usuarios_pedido ON cupons_usuarios(pedido_id);
CREATE INDEX idx_cupons_usuarios_data ON cupons_usuarios(data_uso);
```

Criar arquivo `backend/migrations/003-add-pedidos-cupom-codigo.sql`:

```sql
-- Adiciona cupom_codigo aos pedidos
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cupom_codigo VARCHAR(50);
```

### PASSO 2: Atualizar Rota de Cupons

Modificar `backend/routes/cupons.js`:

```javascript
const express = require('express');
const router = express.Router();
const {
  validarCupom,
  listarCupons,
  criarCupom,
  atualizarCupom,
  deletarCupom,
  listarHistoricoCupons,
} = require('../controllers/cupomController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rota de validação com login obrigatório
router.post('/validar', authenticate, validarCupom);

// Rotas protegidas (admin)
router.get('/', authenticate, isAdmin, listarCupons);
router.post('/', authenticate, isAdmin, criarCupom);
router.put('/:id', authenticate, isAdmin, atualizarCupom);
router.delete('/:id', authenticate, isAdmin, deletarCupom);

// Nova rota: Histórico de cupons (admin)
router.get('/historico/:cupomId', authenticate, isAdmin, listarHistoricoCupons);

module.exports = router;
```

### PASSO 3: Atualizar Controller de Cupons

Adicionar ao `backend/controllers/cupomController.js`:

```javascript
// Novo endpoint para listar histórico de uso de um cupom
const listarHistoricoCupons = async (req, res) => {
  try {
    const { cupomId } = req.params;
    const { limite = 50, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    // Buscar informações do cupom
    const cupomResult = await pool.query(
      'SELECT * FROM cupons WHERE id = $1',
      [cupomId]
    );

    if (cupomResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cupom nao encontrado',
      });
    }

    // Buscar histórico de uso
    const historicoResult = await pool.query(
      `SELECT 
        cu.id,
        cu.cupom_id,
        cu.usuario_id,
        u.nome as usuario_nome,
        u.email as usuario_email,
        cu.pedido_id,
        cu.data_uso,
        p.total as pedido_valor
      FROM cupons_usuarios cu
      JOIN usuarios u ON cu.usuario_id = u.id
      LEFT JOIN pedidos p ON cu.pedido_id = p.id
      WHERE cu.cupom_id = $1
      ORDER BY cu.data_uso DESC
      LIMIT $2 OFFSET $3`,
      [cupomId, parseInt(limite), offset]
    );

    // Contar total
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM cupons_usuarios WHERE cupom_id = $1',
      [cupomId]
    );

    res.json({
      success: true,
      cupom: cupomResult.rows[0],
      historico: historicoResult.rows,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      limite: parseInt(limite),
    });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar histórico',
    });
  }
};

module.exports = {
  validarCupom,
  listarCupons,
  criarCupom,
  atualizarCupom,
  deletarCupom,
  listarHistoricoCupons, // ✅ Nova função
};
```

### PASSO 4: Atualizar Controller de Pedidos

Modificar `backend/controllers/pedidoController.js`:

```javascript
// Dentro da função criarPedido, na seção de aplicação de cupom:

// Aplicar cupom se fornecido
let desconto = 0;
let cupomUsado = null;

if (cupom_codigo) {
  const cupomResult = await client.query(
    `SELECT * FROM cupons 
     WHERE codigo = $1 AND ativo = true 
     AND (data_validade IS NULL OR data_validade >= NOW())
     AND (usos_maximos IS NULL OR usos_atuais < usos_maximos)`,
    [cupom_codigo]
  );

  if (cupomResult.rows.length === 0) {
    await client.query('ROLLBACK');
    return res.status(400).json({
      success: false,
      error: 'Cupom invalido',
    });
  }

  const cupom = cupomResult.rows[0];

  if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
    await client.query('ROLLBACK');
    return res.status(400).json({
      success: false,
      error: 'Cupom invalido',
    });
  }

  if (cupom.usos_maximos && cupom.usos_atuais >= cupom.usos_maximos) {
    await client.query('ROLLBACK');
    return res.status(400).json({
      success: false,
      error: 'Cupom esgotado',
    });
  }
    
  // ✅ VERIFICAR se usuário já usou este cupom
  const jaUsouResult = await client.query(
    `SELECT id FROM cupons_usuarios 
     WHERE cupom_id = $1 AND usuario_id = $2`,
    [cupom.id, userId]
  );

  if (jaUsouResult.rows.length > 0) {
    await client.query('ROLLBACK');
    return res.status(400).json({
      success: false,
      error: 'Ja utilizado',
    });
  }
    
  // Validar valor mínimo
  if (cupom.valor_minimo && subtotal < cupom.valor_minimo) {
    await client.query('ROLLBACK');
    return res.status(400).json({
      success: false,
      error: 'Cupom invalido',
    });
  }
    
  // Calcular desconto
  if (cupom.tipo_desconto === 'percentual') {
    desconto = (subtotal * cupom.valor_desconto) / 100;
  } else {
    desconto = cupom.valor_desconto;
  }

    // Não deixar desconto maior que o subtotal
    if (desconto > subtotal) {
      desconto = subtotal;
    }

    cupomUsado = cupom;
}

// ... resto do código ...

// Depois de inserir o pedido:
if (cupomUsado) {
  await client.query(
    'UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = $1',
    [cupomUsado.id]
  );

  await client.query(
    `INSERT INTO cupons_usuarios (cupom_id, usuario_id, pedido_id)
     VALUES ($1, $2, $3)`,
    [cupomUsado.id, userId, pedido.id]
  );
}
```

---

## 🧪 TESTES SUGERIDOS

### Teste 1: Usuário não pode usar cupom duas vezes
```bash
# Criar cupom
POST /api/cupons
{ "codigo": "TESTE123", "tipo_desconto": "fixo", "valor_desconto": 10, "usos_maximos": 100 }

# Usuário 1 usa cupom
POST /api/pedidos
{ "itens": [...], "cupom_codigo": "TESTE123" }
# ✅ Sucesso

# Usuário 1 tenta usar novamente
POST /api/pedidos
{ "itens": [...], "cupom_codigo": "TESTE123" }
# ❌ Erro: "Ja utilizado"
```

### Teste 2: Diferentes usuários podem usar
```bash
# Usuário 1 usa
POST /api/pedidos { "cupom_codigo": "TESTE123" }
# ✅ Sucesso

# Usuário 2 usa mesmo cupom
POST /api/pedidos { "cupom_codigo": "TESTE123" }
# ✅ Sucesso

# Cupom agora tem usos_atuais = 2
GET /api/cupons/1
# { usos_atuais: 2, usos_maximos: 100 }
```

### Teste 3: Cupom esgota para todos
```bash
# Criar cupom com limite de 2 usos
POST /api/cupons
{ "usos_maximos": 2 }

# Usuário 1 usa
POST /api/pedidos { "cupom_codigo": "TESTE" }
# ✅ Sucesso (usos_atuais: 1)

# Usuário 2 usa
POST /api/pedidos { "cupom_codigo": "TESTE" }
# ✅ Sucesso (usos_atuais: 2)

# Usuário 3 tenta usar
POST /api/pedidos { "cupom_codigo": "TESTE" }
# ❌ Erro: "Cupom esgotado"
```

---

## 📊 QUERIES ÚTEIS PARA ADMIN

```sql
-- Ver quantos usuários diferentes usaram um cupom
SELECT COUNT(DISTINCT usuario_id) 
FROM cupons_usuarios 
WHERE cupom_id = 5;

-- Ver quanto foi economizado com cupons
SELECT 
  c.codigo,
  COUNT(*) as total_usos,
  SUM(p.desconto) as total_desconto
FROM cupons_usuarios cu
JOIN cupons c ON cu.cupom_id = c.id
JOIN pedidos p ON cu.pedido_id = p.id
GROUP BY c.id, c.codigo
ORDER BY total_desconto DESC;

-- Ver cupons mais usados
SELECT 
  c.codigo,
  c.tipo_desconto,
  c.valor_desconto,
  COUNT(*) as vezes_usado,
  c.usos_maximos
FROM cupons_usuarios cu
JOIN cupons c ON cu.cupom_id = c.id
GROUP BY c.id, c.codigo
ORDER BY vezes_usado DESC;

-- Ver histórico completo de um usuário com cupons
SELECT 
  p.id as pedido_id,
  c.codigo as cupom_usado,
  p.total,
  p.desconto,
  p.data_pedido
FROM pedidos p
LEFT JOIN cupons_usuarios cu ON p.id = cu.pedido_id
LEFT JOIN cupons c ON cu.cupom_id = c.id
WHERE p.usuario_id = 1
ORDER BY p.data_pedido DESC;
```

---

**Atualizado em**: 8 de fevereiro de 2026
**Status**: Implementado - Pronto para Testes
**Versão**: 2.1 - Login, valor minimo e historico
