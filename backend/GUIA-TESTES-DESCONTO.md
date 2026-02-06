# 🧪 Guia de Testes: Desconto Percentual

## 📋 Pré-requisitos

Antes de executar os testes, você precisa:

1. ✅ Servidor backend rodando
2. ✅ Banco de dados PostgreSQL acessível
3. ✅ Usuário admin para autenticação

---

## 🚀 Como Executar os Testes

### Opção 1: Teste Automático (Recomendado)

```bash
# Terminal 1: Iniciar o servidor backend
cd backend
npm run dev

# Terminal 2: Criar usuário de teste (primeira vez)
node criar-usuario-teste.js

# Terminal 3: Executar os testes
node test-desconto-percentual.js
```

O script fará automaticamente:
- ✅ Verificar conexão com o servidor
- ✅ Fazer login como admin
- ✅ Executar os testes de desconto
- ✅ Gerar relatório completo

---

### Opção 2: Com Token JWT

Se você já tem um token válido:

```bash
# Linux/Mac
TEST_TOKEN="seu_token_aqui" node test-desconto-percentual.js

# Windows PowerShell
$env:TEST_TOKEN="seu_token_aqui"; node test-desconto-percentual.js

# Windows CMD
set TEST_TOKEN=seu_token_aqui && node test-desconto-percentual.js
```

---

### Opção 3: Teste Manual via cURL

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","senha":"Senha123!"}'

# 2. Copiar o token retornado

# 3. Criar produto com desconto
curl -X POST http://localhost:5000/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome":"Teste Desconto",
    "preco":2100,
    "preco_original":30000,
    "desconto_percentual":93,
    "categoria_id":3,
    "estoque":5
  }'

# 4. Atualizar desconto
curl -X PUT http://localhost:5000/api/produtos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "desconto_percentual":50
  }'
```

---

## 🧪 O que os Testes Verificam

### Teste 1: Criar Produto com Desconto Válido
```
✅ Testa se desconto válido (93%) é salvo corretamente
✅ Verifica status HTTP 200
✅ Confirma que desconto não gera erro no banco
```

### Teste 2: Atualizar Desconto como String
```
✅ Testa conversão de string "50.5" para número
✅ Valida se o backend converte corretamente
✅ Confirma que não há erro de tipo
```

### Teste 3: Desconto > 100%
```
✅ Testa limitação de desconto
✅ Verifica se valor 150 é reduzido para 100
✅ Valida que desconto nunca ultrapassa 100%
```

### Teste 4: Desconto Inválido
```
✅ Testa tratamento de valores inválidos
✅ Verifica se "abcd" é convertido para 0
✅ Valida que NaN é tratado com segurança
```

---

## 📊 Interpretando os Resultados

### ✅ Sucesso Esperado
```
════════════════════════════════════════════════════════════
✅ Teste 1: Criar produto com desconto válido
────────────────────────────────────────────────────────────
✅ Status HTTP: 200 (esperado: 200)
✅ Sem erros na resposta
📊 Resposta: {...success: true...}

🎉 TODOS OS TESTES PASSARAM!
════════════════════════════════════════════════════════════
```

### ⚠️ Falhas Comuns

#### Erro: "Formato de token inválido"
```
Solução:
1. Execute: node criar-usuario-teste.js
2. Verifique se o servidor está rodando
3. Tente novamente: node test-desconto-percentual.js
```

#### Erro: "Falha ao conectar ao servidor"
```
Solução:
1. Certifique-se que npm run dev está rodando
2. Verifique se http://localhost:5000 é acessível
3. Verifique logs do backend para erros
```

#### Erro: "Desconto: undefined"
```
Solução:
1. Verifique se o produto foi criado (status 201 esperado)
2. Consulte a resposta da API nos logs
3. Verifique se a estrutura de dados retornada mudou
```

---

## 🔧 Configuração de Usuários de Teste

### Criar Múltiplos Usuários
```bash
# Editar criar-usuario-teste.js e adicionar no final:
await criarUsuario('user1@test.com', 'Senha123!', false);
await criarUsuario('user2@test.com', 'Senha456!', true);
```

### Usar Credenciais Diferentes
```bash
# Editar test-desconto-percentual.js
const TEST_USER = {
  email: 'seu-email@test.com',
  senha: 'sua-senha'
};
```

---

## 📈 Analisando Resultados Detalhados

O teste gera um relatório com:

```
📊 RESUMO DOS TESTES

✅ Testes aprovados: 10
❌ Testes falhados: 0
📈 Taxa de sucesso: 100.0%
```

**Significado:**
- **10 testes aprovados** = Todos os 4 testes passaram (4 × 2-3 validações cada)
- **0 testes falhados** = Nenhuma falha
- **100.0%** = Taxa de sucesso perfeita

---

## 🐛 Debugging

### Ver Logs Detalhados
```bash
# Adicionar variável de debug
DEBUG=* node test-desconto-percentual.js
```

### Ver Resposta Completa da API
```bash
# Editar test-desconto-percentual.js, linha ~120
console.log(`📊 Resposta:`, JSON.stringify(response.data, null, 2));
// Remove .substring(0, 200) para ver tudo
```

### Teste Individual
```bash
# Testar apenas a criação de produto
curl -X POST http://localhost:5000/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"nome":"Teste","preco":100,"categoria_id":1}'
```

---

## 🔗 Relacionado

- 📄 [CORRECAO-DESCONTO-PERCENTUAL.md](../CORRECAO-DESCONTO-PERCENTUAL.md) - Documentação técnica
- 📄 [GUIA-IMPLEMENTACAO-DESCONTO.md](../GUIA-IMPLEMENTACAO-DESCONTO.md) - Guia de implementação
- 📄 [RESUMO-DESCONTO-PERCENTUAL.md](../RESUMO-DESCONTO-PERCENTUAL.md) - Resumo rápido

---

## 💡 Dicas Úteis

1. **Primeiro teste sempre falha?** 
   - Execute `node criar-usuario-teste.js` primeiro

2. **Token expirado?**
   - Execute os testes novamente para fazer login automático

3. **Desconto não atualiza?**
   - Verifique se o produto ID está correto (padrão: 1)
   - Consulte a tabela de produtos no banco

4. **Quer testar valores específicos?**
   - Edite o array `tests` no script e adicione novos testes

---

**Data:** 6 de fevereiro de 2026
**Status:** ✅ Pronto para usar
