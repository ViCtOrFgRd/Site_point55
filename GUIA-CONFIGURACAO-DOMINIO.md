# 🚀 Guia de Configuração para Produção com Domínio

## 📋 Visão Geral

Este guia explica como configurar o sistema Point55 para produção quando você adicionar um domínio próprio. Todas as URLs estão configuradas usando variáveis de ambiente, facilitando a migração.

---

## 🔧 Configurações Necessárias

### 1️⃣ Backend (.env)

Localização: `backend/.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=point55
DB_USER=postgres
DB_PASSWORD=sua_senha_segura

# JWT Configuration
JWT_SECRET=sua_chave_jwt_super_segura_e_aleatoria
JWT_EXPIRES_IN=24h

# Frontend URL (usado para CORS e links em emails)
# ⚠️ ALTERAR para seu domínio
FRONTEND_URL=https://seudominio.com.br

# Email Configuration
EMAIL_USER=atendimento.sacpoint@gmail.com
EMAIL_PASSWORD=eqpp gdlv aiar qbeg
```

### 2️⃣ Frontend (.env.local)

Localização: `frontend/.env.local`

```env
# API Backend URL
# ⚠️ ALTERAR para o endpoint da sua API
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br/api
# OU se backend estiver no mesmo domínio:
# NEXT_PUBLIC_API_URL=https://seudominio.com.br/api

# URL base do site
NEXT_PUBLIC_SITE_URL=https://seudominio.com.br

# Ambiente
NODE_ENV=production
```

---

## 🌐 Cenários de Configuração

### Cenário 1: API em Subdomínio Separado

```
Frontend: https://seudominio.com.br
Backend:  https://api.seudominio.com.br
```

**Backend .env:**
```env
FRONTEND_URL=https://seudominio.com.br
PORT=5000
```

**Frontend .env.local:**
```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br/api
NEXT_PUBLIC_SITE_URL=https://seudominio.com.br
```

### Cenário 2: API no Mesmo Domínio (Proxy)

```
Frontend: https://seudominio.com.br
Backend:  https://seudominio.com.br/api (via nginx/proxy)
```

**Backend .env:**
```env
FRONTEND_URL=https://seudominio.com.br
PORT=5000
```

**Frontend .env.local:**
```env
NEXT_PUBLIC_API_URL=https://seudominio.com.br/api
NEXT_PUBLIC_SITE_URL=https://seudominio.com.br
```

### Cenário 3: IP Público (Atual - Temporário)

```
Frontend: http://45.176.139.246
Backend:  http://45.176.139.246:5000
```

**Backend .env:**
```env
FRONTEND_URL=http://45.176.139.246
PORT=5000
```

**Frontend .env.local:**
```env
NEXT_PUBLIC_API_URL=http://45.176.139.246:5000/api
NEXT_PUBLIC_SITE_URL=http://45.176.139.246
```

---

## ✅ Checklist de Migração

Quando adicionar o domínio, siga esta ordem:

### 1. Configurar DNS
- [ ] Apontar domínio principal (A record) para o IP do servidor
- [ ] Criar subdomínio api (se usar cenário 1)
- [ ] Aguardar propagação DNS (24-48h)

### 2. Configurar SSL/HTTPS
- [ ] Instalar certificado SSL (Let's Encrypt recomendado)
- [ ] Configurar renovação automática
- [ ] Testar HTTPS

### 3. Atualizar Backend
- [ ] Editar `backend/.env`:
  - Alterar `FRONTEND_URL` para seu domínio
  - Alterar `NODE_ENV=production`
  - Verificar `JWT_SECRET` (deve ser seguro)
- [ ] Reiniciar servidor backend: `npm start`
- [ ] Testar: `curl https://api.seudominio.com.br/health`

### 4. Atualizar Frontend
- [ ] Criar/editar `frontend/.env.local`:
  - Alterar `NEXT_PUBLIC_API_URL`
  - Alterar `NEXT_PUBLIC_SITE_URL`
  - Alterar `NODE_ENV=production`
- [ ] Rebuild do frontend: `npm run build`
- [ ] Reiniciar servidor frontend: `npm start`
- [ ] Testar acesso: `https://seudominio.com.br`

### 5. Testar Funcionalidades
- [ ] Login/Registro
- [ ] Recuperação de senha (verificar email com link correto)
- [ ] Favoritos
- [ ] Carrinho
- [ ] Checkout
- [ ] Emails de confirmação

---

## 📧 Emails em Produção

Os emails já estão configurados para usar a variável `FRONTEND_URL`. Quando você alterar o domínio no `.env`, os links nos emails serão atualizados automaticamente:

**Emails afetados:**
- ✉️ Recuperação de senha → `https://seudominio.com.br/nova-senha?token=...`
- ✉️ Confirmação de pedido
- ✉️ Promoções

**Localização do código:**
- `backend/services/emailService.js` (usa `process.env.FRONTEND_URL`)

---

## 🔒 Segurança em Produção

### CORS
O CORS já está configurado para usar `FRONTEND_URL` automaticamente:
- Localização: `backend/server.js`
- Permite apenas requisições do seu domínio

### Variáveis Sensíveis
⚠️ **NUNCA commitar:**
- `backend/.env`
- `frontend/.env.local`

✅ **Sempre usar:**
- `backend/.env.example` (template sem dados sensíveis)
- `frontend/.env.example` (template sem dados sensíveis)

---

## 🚦 Testando Localmente

Para testar localmente antes da migração:

```bash
# Backend
cd backend
npm start

# Frontend (nova janela)
cd frontend
npm run dev
```

URLs de teste:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api

---

## 📁 Arquivos Importantes

```
backend/
  ├── .env                    # ⚠️ Configurações de produção (não commitar)
  ├── .env.example            # ✅ Template para .env
  ├── server.js               # Configuração CORS dinâmica
  └── services/
      └── emailService.js     # Links de email dinâmicos

frontend/
  ├── .env.local              # ⚠️ Configurações de produção (não commitar)
  ├── .env.example            # ✅ Template para .env.local
  └── src/
      ├── services/api.ts     # Cliente API com URL dinâmica
      └── app/
          └── nova-senha/
              └── page.tsx    # Usa NEXT_PUBLIC_API_URL
```

---

## 🆘 Troubleshooting

### Erro: "CORS policy blocked"
- ✅ Verificar `FRONTEND_URL` no backend/.env
- ✅ Verificar se o domínio está correto (com/sem https://)
- ✅ Reiniciar backend após alterar .env

### Erro: "Failed to fetch"
- ✅ Verificar `NEXT_PUBLIC_API_URL` no frontend/.env.local
- ✅ Testar endpoint manualmente: `curl https://api.seudominio.com.br/health`
- ✅ Verificar firewall/portas

### Links de email quebrados
- ✅ Verificar `FRONTEND_URL` no backend/.env
- ✅ Deve incluir `https://` ou `http://`
- ✅ Não incluir barra final: ❌ `https://dominio.com.br/`

---

## 📞 Contatos

**Email de Atendimento:** atendimento.sacpoint@gmail.com  
**WhatsApp:** (11) 99338-5579

---

## 📝 Exemplo Completo

### Desenvolvimento (Atual)
```env
# backend/.env
FRONTEND_URL=http://localhost:3000

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Produção (Após adicionar domínio)
```env
# backend/.env
FRONTEND_URL=https://k2oncasa.com.br

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://api.k2oncasa.com.br/api
NEXT_PUBLIC_SITE_URL=https://k2oncasa.com.br
```

---

**Data de criação:** 06/02/2026  
**Versão:** 1.0
