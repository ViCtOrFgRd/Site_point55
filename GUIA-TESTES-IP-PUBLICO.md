# Guia de Testes com IP Público

## Configuração para IP Público: 45.176.139.246

### ✅ Alterações Realizadas

1. **Frontend (.env.local)**
   - API URL: `http://45.176.139.246:5000/api`
   
2. **Backend (.env)**
   - FRONTEND_URL: `http://45.176.139.246:3000`
   - CORS configurado para aceitar requisições do IP público

### 📝 Passos para Testar

#### 1. **Reiniciar os Servidores**

Backend (porta 5000):
```bash
cd backend
npm start
```

Frontend (porta 3000):
```bash
cd frontend
npm run dev
```

#### 2. **Acessar a Aplicação**

- **Frontend:** `http://45.176.139.246:3000`
- **API:** `http://45.176.139.246:5000/api`

#### 3. **Verificar Conectividade**

Testar rota de teste do backend:
```bash
curl http://45.176.139.246:5000/
```

Resposta esperada:
```json
{
  "message": "🚀 API Point55 está online!",
  "version": "1.0.0",
  "timestamp": "2026-02-05T..."
}
```

### 🔧 Configurações de Firewall/Portas

Portas que devem estar abertas:
- **3000** - Frontend (Next.js)
- **5000** - Backend (Express API)
- **5432** - PostgreSQL (apenas local, não expor)

### 🚨 Possíveis Problemas e Soluções

#### Problema: CORS bloqueado
**Solução:** Verificar se `FRONTEND_URL` no backend está correto
```bash
# Verificar .env
cat backend/.env | grep FRONTEND_URL
```

#### Problema: API retorna 502/503
**Solução:** Verificar se backend está rodando
```bash
# Testar conectividade
curl http://45.176.139.246:5000/
```

#### Problema: Database não conecta
**Solução:** Verificar se PostgreSQL está rodando
```bash
# Testar conexão (localmente)
psql -h localhost -U postgres -d point55 -c "SELECT 1;"
```

### 📊 Dados para Teste

#### Usuário Admin (se criado):
- Email: admin@point55.com
- Senha: (conforme criado)

#### Usuário Teste:
- Email: teste@point55.com
- Senha: (conforme criado)

### ✨ Funcionalidades para Testar

- [x] Listagem de produtos com filtros
- [x] Carrinho de compras
- [x] Checkout com cupons
- [x] Admin panel (badges, banners, cupons)
- [x] Navegação por categorias
- [x] Promoções
- [x] Busca de produtos

### 📱 URLs Úteis

| Página | URL |
|--------|-----|
| Home | http://45.176.139.246:3000 |
| Produtos | http://45.176.139.246:3000/produtos |
| Promoções | http://45.176.139.246:3000/promocoes |
| Carrinho | http://45.176.139.246:3000/carrinho |
| Checkout | http://45.176.139.246:3000/checkout |
| Admin | http://45.176.139.246:3000/admin |
| Login | http://45.176.139.246:3000/perfil |

### 🔐 Segurança - IMPORTANTE

⚠️ **Antes de colocar em produção:**

1. Mudar `NODE_ENV` de "development" para "production"
2. Gerar novo `JWT_SECRET` seguro
3. Configurar HTTPS (SSL/TLS)
4. Restringir CORS apenas para domínios permitidos
5. Adicionar rate limiting
6. Configurar variáveis de ambiente seguras

```bash
# Gerar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 📋 Checklist de Testes

- [ ] Frontend carrega corretamente
- [ ] API responde em /
- [ ] Listagem de produtos funciona
- [ ] Filtros funcionam
- [ ] Carrinho persiste
- [ ] Checkout completo
- [ ] Cupons aplicam desconto
- [ ] Admin panel acessível
- [ ] CORS não bloqueia requisições
- [ ] Sem erros no console

---

**Data:** 5 de fevereiro de 2026  
**IP Público:** 45.176.139.246  
**Status:** ✅ Pronto para testes
