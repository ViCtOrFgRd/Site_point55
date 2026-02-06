# Mapeamento de Portas - Roteador

## ✅ Configuração Atual do Roteador

```
Porta Externa 80  → 192.168.0.110:3000  (Frontend Next.js)
Porta Externa 3000 → 192.168.0.110:5000 (Backend API Express)
```

## 📍 Acessos Públicos

| Serviço | URL Pública | IP Interno | Porta Interna |
|---------|------------|-----------|--------------|
| **Frontend** | http://45.176.139.246 | 192.168.0.110 | 3000 |
| **Frontend alt** | http://45.176.139.246:80 | 192.168.0.110 | 3000 |
| **Backend API** | http://45.176.139.246:3000/api | 192.168.0.110 | 5000 |

## 🔧 Configurações Atualizadas

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://45.176.139.246:3000/api
```

### Backend (.env)
```bash
PORT=5000
FRONTEND_URL=http://45.176.139.246
```

## 🚀 Como Acessar

1. **Frontend (sem especificar porta):**
   ```
   http://45.176.139.246/
   ```

2. **Frontend (especificando porta 80):**
   ```
   http://45.176.139.246:80/
   ```

3. **API do Backend:**
   ```
   http://45.176.139.246:3000/api/
   ```

## ✨ Fluxo de Requisições

```
[Cliente na Internet]
    ↓
http://45.176.139.246:3000 (porta 3000 externa)
    ↓
[Roteador]
    ↓
192.168.0.110:5000 (porta 5000 interna) → Backend Express
```

```
[Cliente na Internet]
    ↓
http://45.176.139.246 ou :80 (porta 80 externa)
    ↓
[Roteador]
    ↓
192.168.0.110:3000 (porta 3000 interna) → Frontend Next.js
```

## ✅ Verificação

Para testar se está funcionando:

```bash
# Testar Frontend
curl http://45.176.139.246/

# Testar API
curl http://45.176.139.246:3000/api/

# Testar CORS
curl -H "Origin: http://45.176.139.246" http://45.176.139.246:3000/api/
```

## 📊 Status

- ✅ Frontend acessível em porta 80 (redirecionada)
- ✅ Backend acessível em porta 3000 (redirecionada de 5000)
- ✅ CORS configurado para aceitar origem `http://45.176.139.246`
- ✅ Frontend sabe onde encontrar a API (`http://45.176.139.246:3000/api`)

---

**Data:** 5 de fevereiro de 2026  
**Roteador:** Configurado corretamente ✅
