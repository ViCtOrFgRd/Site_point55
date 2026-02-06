// Middleware para verificar se usuário é administrador
const isAdmin = (req, res, next) => {
  try {
    // Verificar se usuário está autenticado (deve vir após authenticate middleware)
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária',
      });
    }

    // Verificar se é admin
    if (!req.usuario.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem acessar este recurso',
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de autorização:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar autorização',
    });
  }
};

// Middleware para verificar se o usuário é o próprio ou é admin
// Nota: Função auxiliar pronta para uso futuro em rotas que precisem verificar propriedade de recursos
const isOwnerOrAdmin = (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária',
      });
    }

    // Se é admin, pode acessar qualquer recurso
    if (req.usuario.is_admin) {
      return next();
    }

    // Se não é admin, verificar se é o próprio usuário
    const userId = parseInt(req.params.id || req.params.userId);
    
    if (userId && userId !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Você só pode acessar seus próprios recursos',
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de autorização:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar autorização',
    });
  }
};

module.exports = {
  isAdmin,
  isOwnerOrAdmin,
};
