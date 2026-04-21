const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { iniciarSchedulerRetirada } = require('./services/retiradaScheduler');
const { startBackupScheduler } = require('./services/databaseBackupService');

// Inicializar Express
const app = express();
app.set('trust proxy', 1);

const jwtSecret = process.env.JWT_SECRET || '';

if (!jwtSecret) {
  console.error('❌ JWT_SECRET não configurado. Servidor não iniciado.');
  process.exit(1);
}

if (jwtSecret.length < 16) {
  console.error('❌ JWT_SECRET muito curto. Use pelo menos 16 caracteres.');
  process.exit(1);
}

const normalizeOrigin = (value) => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim().replace(/\/$/, '');
  return trimmed || null;
};

const buildOriginVariants = (origin) => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return [];
  }

  const variants = new Set([normalized]);

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname;
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname;

    variants.add(`${parsed.protocol}//${hostname}${pathname}`.replace(/\/$/, ''));

    if (parsed.protocol === 'https:') {
      variants.add(`http://${hostname}${pathname}`.replace(/\/$/, ''));
    }

    if (parsed.protocol === 'http:') {
      variants.add(`https://${hostname}${pathname}`.replace(/\/$/, ''));
    }

    if (hostname.startsWith('www.')) {
      const withoutWww = hostname.slice(4);
      variants.add(`${parsed.protocol}//${withoutWww}${pathname}`.replace(/\/$/, ''));
    } else {
      variants.add(`${parsed.protocol}//www.${hostname}${pathname}`.replace(/\/$/, ''));
    }
  } catch {
    // Mantem apenas a origem original se nao for URL absoluta.
  }

  return [...variants].filter(Boolean);
};

// Origens permitidas - usar FRONTEND_URL do .env
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...buildOriginVariants(frontendUrl),
];

// Configuração de middlewares
app.use(cors({
  origin: function (origin, callback) {
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
const notificacoesRoutes = require('./routes/notificacoes');
const webhooksRoutes = require('./routes/webhooks');
const caixasRoutes = require('./routes/caixas');
const configFreteRoutes = require('./routes/configFrete');
const tiposProdutoRoutes = require('./routes/tiposProduto');
const conteudoInstitucionalRoutes = require('./routes/conteudoInstitucional');
const conteudoInstitucionalAdminRoutes = require('./routes/conteudoInstitucionalAdmin');

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
app.use('/api/conteudo-institucional', conteudoInstitucionalRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/superfrete', superfreteRoutes);
app.use('/api/devolucoes', devolucoesRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/admin/caixas-catalogo', caixasRoutes);
app.use('/api/admin/config-frete', configFreteRoutes);
app.use('/api/admin/tipos-produto', tiposProdutoRoutes);
app.use('/api/admin/conteudo-institucional', conteudoInstitucionalAdminRoutes);

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

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    io.use((socket, next) => {
      const authToken = socket.handshake?.auth?.token;
      const headerToken = socket.handshake?.headers?.authorization;
      let token = authToken;

      if (!token && headerToken && headerToken.startsWith('Bearer ')) {
        token = headerToken.slice(7);
      }

      if (!token) {
        return next(new Error('Token de autenticação não fornecido'));
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error('Token inválido ou expirado'));
        }
        socket.usuario = decoded;
        return next();
      });
    });

    io.on('connection', (socket) => {
      socket.join('users');

      if (socket.usuario?.is_admin) {
        socket.join('admin');
      }

      if (socket.usuario?.id) {
        socket.join(`user:${socket.usuario.id}`);
      }
    });

    const { setSocketIo } = require('./services/socket');
    setSocketIo(io);

    // Iniciar servidor Express
    httpServer.listen(PORT, () => {
      console.log('\n🎉 ========================================');
      console.log(`   Servidor Point55 Backend iniciado!`);
      console.log(`   🌐 URL: http://localhost:${PORT}`);
      console.log(`   🔒 Proxy confiavel: ${app.get('trust proxy') ? 'sim' : 'nao'}`);
      console.log(`   📦 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`   ⏰ Horário: ${new Date().toLocaleString('pt-BR')}`);
      console.log('========================================\n');
    });

    iniciarSchedulerRetirada();
    startBackupScheduler();
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
