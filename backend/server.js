const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Inicializar Express
const app = express();

// Configuração de middlewares
app.use(cors({
  origin: function (origin, callback) {
    // Origens permitidas - usar FRONTEND_URL do .env
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      frontendUrl,
      // Adicionar variações com e sem porta para produção
      frontendUrl.replace(':3000', ''),
      frontendUrl.replace(':3000', ':80'),
    ];

    // Se não houver origin (requisições do mesmo servidor) ou se estiver na whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Servir arquivos estáticos da pasta image
app.use('/image', express.static(path.join(__dirname, '../image')));

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Point55 está online!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Rota de health check do database
app.get('/health/database', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      res.json({
        status: 'ok',
        database: 'connected',
        timestamp: Date.now(),
      });
    } else {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'error',
      message: error.message,
      timestamp: Date.now(),
    });
  }
});

// Importar rotas
const authRoutes = require('./routes/auth');
const categoriasRoutes = require('./routes/categorias');
const produtosRoutes = require('./routes/produtos');
const enderecosRoutes = require('./routes/enderecos');
const pedidosRoutes = require('./routes/pedidos');
const avaliacoesRoutes = require('./routes/avaliacoes');
const cuponsRoutes = require('./routes/cupons');
const newsletterRoutes = require('./routes/newsletter');
const usuariosRoutes = require('./routes/usuarios');
const badgesRoutes = require('./routes/badges');
const promocoesRoutes = require('./routes/promocoes');
const carrinhoRoutes = require('./routes/carrinho');
const bannersRoutes = require('./routes/banners');
const favoritosRoutes = require('./routes/favoritos');
const superfreteRoutes = require('./routes/superfrete');
const devolucoesRoutes = require('./routes/devolucoes');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/enderecos', enderecosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api', avaliacoesRoutes);
app.use('/api/cupons', cuponsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/promocoes', promocoesRoutes);
app.use('/api/carrinho', carrinhoRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/superfrete', superfreteRoutes);
app.use('/api/devolucoes', devolucoesRoutes);

// Middleware de erro 404
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Porta do servidor
const PORT = process.env.PORT || 5000;

// Iniciar servidor
const startServer = async () => {
  try {
    // Testar conexão com banco de dados
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Falha ao conectar com o banco de dados. Servidor não iniciado.');
      process.exit(1);
    }

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log('\n🎉 ========================================');
      console.log(`   Servidor Point55 Backend iniciado!`);
      console.log(`   🌐 URL: http://localhost:${PORT}`);
      console.log(`   📦 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`   ⏰ Horário: ${new Date().toLocaleString('pt-BR')}`);
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais de encerramento
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recebido. Encerrando servidor...');
  process.exit(0);
});

// Iniciar o servidor
startServer();

module.exports = app;
