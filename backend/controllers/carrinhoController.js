const { pool } = require('../config/database');

// GET /api/carrinho - Obter carrinho do usuário
const obterCarrinho = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const result = await pool.query(
      `SELECT c.*, 
              p.nome as produto_nome,
              p.preco as produto_preco,
              p.preco_original as produto_preco_original,
              p.desconto_percentual as produto_desconto,
              p.imagens as produto_imagens,
              p.estoque as produto_estoque,
              p.ativo as produto_ativo
       FROM carrinho c
       INNER JOIN produtos p ON c.produto_id = p.id
       WHERE c.usuario_id = $1
       ORDER BY c.data_adicao DESC`,
      [userId]
    );

    // Calcular totais
    let subtotal = 0;
    const itens = result.rows.map(item => {
      const preco = parseFloat(item.produto_preco);
      const itemSubtotal = preco * item.quantidade;
      subtotal += itemSubtotal;

      return {
        id: item.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        tamanho: item.tamanho,
        cor: item.cor,
        produto: {
          id: item.produto_id,
          nome: item.produto_nome,
          preco: item.produto_preco,
          preco_original: item.produto_preco_original,
          desconto_percentual: item.produto_desconto,
          imagens: item.produto_imagens,
          estoque: item.produto_estoque,
          ativo: item.produto_ativo,
        },
        subtotal: itemSubtotal,
      };
    });

    res.json({
      success: true,
      count: itens.length,
      data: {
        itens,
        subtotal,
      },
    });
  } catch (error) {
    console.error('Erro ao obter carrinho:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar carrinho',
    });
  }
};

// POST /api/carrinho - Adicionar item ao carrinho
const adicionarAoCarrinho = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { produto_id, quantidade, tamanho, cor } = req.body;

    // Validação
    if (!produto_id || !quantidade || quantidade <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Produto e quantidade são obrigatórios',
      });
    }

    // Verificar se produto existe e está ativo
    const produtoResult = await pool.query(
      'SELECT id, estoque, ativo FROM produtos WHERE id = $1',
      [produto_id]
    );

    if (produtoResult.rows.length === 0 || !produtoResult.rows[0].ativo) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado ou indisponível',
      });
    }

    const produto = produtoResult.rows[0];

    // Verificar estoque
    if (produto.estoque < quantidade) {
      return res.status(400).json({
        success: false,
        error: `Estoque insuficiente. Disponível: ${produto.estoque}`,
      });
    }

    // Verificar se já existe no carrinho
    const itemExistente = await pool.query(
      `SELECT id, quantidade FROM carrinho 
       WHERE usuario_id = $1 AND produto_id = $2 AND tamanho = $3 AND cor = $4`,
      [userId, produto_id, tamanho, cor]
    );

    let result;

    if (itemExistente.rows.length > 0) {
      // Atualizar quantidade
      const novaQuantidade = itemExistente.rows[0].quantidade + quantidade;

      if (produto.estoque < novaQuantidade) {
        return res.status(400).json({
          success: false,
          error: `Estoque insuficiente. Disponível: ${produto.estoque}`,
        });
      }

      result = await pool.query(
        'UPDATE carrinho SET quantidade = $1 WHERE id = $2 RETURNING *',
        [novaQuantidade, itemExistente.rows[0].id]
      );
    } else {
      // Adicionar novo item
      result = await pool.query(
        `INSERT INTO carrinho (usuario_id, produto_id, quantidade, tamanho, cor)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, produto_id, quantidade, tamanho, cor]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Item adicionado ao carrinho',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar ao carrinho',
    });
  }
};

// PUT /api/carrinho/:id - Atualizar quantidade do item
const atualizarItem = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;
    const { quantidade } = req.body;

    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'ID do item inválido',
      });
    }

    if (!quantidade || quantidade <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade inválida',
      });
    }

    // Verificar se item pertence ao usuário
    const itemResult = await pool.query(
      'SELECT produto_id FROM carrinho WHERE id = $1 AND usuario_id = $2',
      [parseInt(id), userId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item não encontrado no carrinho',
      });
    }

    // Verificar estoque
    const produtoResult = await pool.query(
      'SELECT estoque FROM produtos WHERE id = $1',
      [itemResult.rows[0].produto_id]
    );

    if (produtoResult.rows[0].estoque < quantidade) {
      return res.status(400).json({
        success: false,
        error: `Estoque insuficiente. Disponível: ${produtoResult.rows[0].estoque}`,
      });
    }

    const result = await pool.query(
      'UPDATE carrinho SET quantidade = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *',
      [quantidade, parseInt(id), userId]
    );

    res.json({
      success: true,
      message: 'Item atualizado',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar item',
    });
  }
};

// DELETE /api/carrinho/:id - Remover item do carrinho
const removerItem = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'ID do item inválido',
      });
    }

    const result = await pool.query(
      'DELETE FROM carrinho WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [parseInt(id), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item não encontrado no carrinho',
      });
    }

    res.json({
      success: true,
      message: 'Item removido do carrinho',
    });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover item',
    });
  }
};

// DELETE /api/carrinho - Limpar carrinho
const limparCarrinho = async (req, res) => {
  try {
    const userId = req.usuario.id;

    await pool.query('DELETE FROM carrinho WHERE usuario_id = $1', [userId]);

    res.json({
      success: true,
      message: 'Carrinho limpo com sucesso',
    });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar carrinho',
    });
  }
};

// POST /api/carrinho/sincronizar - Sincronizar carrinho do localStorage com o banco
const sincronizarCarrinho = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { itens } = req.body;

    if (!itens || !Array.isArray(itens)) {
      return res.status(400).json({
        success: false,
        error: 'Lista de itens inválida',
      });
    }

    // Limpar carrinho atual
    await pool.query('DELETE FROM carrinho WHERE usuario_id = $1', [userId]);

    // Adicionar novos itens
    for (const item of itens) {
      const { produto_id, quantidade, tamanho, cor } = item;

      // Verificar produto e estoque
      const produtoResult = await pool.query(
        'SELECT estoque, ativo FROM produtos WHERE id = $1',
        [produto_id]
      );

      if (produtoResult.rows.length > 0 && produtoResult.rows[0].ativo) {
        const estoque = produtoResult.rows[0].estoque;
        const quantidadeFinal = Math.min(quantidade, estoque);

        if (quantidadeFinal > 0) {
          await pool.query(
            `INSERT INTO carrinho (usuario_id, produto_id, quantidade, tamanho, cor)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, produto_id, quantidadeFinal, tamanho, cor]
          );
        }
      }
    }

    // Retornar carrinho atualizado
    const carrinhoAtualizado = await pool.query(
      `SELECT c.*, 
              p.nome as produto_nome,
              p.preco as produto_preco,
              p.imagens as produto_imagens
       FROM carrinho c
       INNER JOIN produtos p ON c.produto_id = p.id
       WHERE c.usuario_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Carrinho sincronizado com sucesso',
      count: carrinhoAtualizado.rows.length,
      data: carrinhoAtualizado.rows,
    });
  } catch (error) {
    console.error('Erro ao sincronizar carrinho:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao sincronizar carrinho',
    });
  }
};

module.exports = {
  obterCarrinho,
  adicionarAoCarrinho,
  atualizarItem,
  removerItem,
  limparCarrinho,
  sincronizarCarrinho,
};
