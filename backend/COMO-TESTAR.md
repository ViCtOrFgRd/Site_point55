# 🚀 PASSO-A-PASSO: Testar Correção de Desconto

## ⚡ TL;DR (Muito Longo; Não Li)

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2 (espere o servidor iniciar)
node criar-usuario-teste.js

# Terminal 3
node test-desconto-percentual.js
```

---

## 📋 Passo 1: Iniciar o Servidor Backend

```bash
cd backend
npm run dev
```

**Esperado na saída:**
```
✅ Servidor rodando em http://localhost:5000
✅ Conectado ao banco de dados PostgreSQL
```

**Se der erro:**
- Verifique se PostgreSQL está rodando
- Verifique a conexão no `.env` do backend
- Verifique se as tabelas existem (rode `schema.sql`)

---

## 📋 Passo 2: Criar Usuário de Teste

Abra **outro terminal** e execute:

```bash
cd backend
node criar-usuario-teste.js
```

**Esperado na saída:**
```
🔐 CRIAR USUÁRIO DE TESTE

════════════════════════════════════════════════════════════

1️⃣ Verificando se usuário já existe...
   ⚠️  Usuário não encontrado, criando...

2️⃣ Gerando hash da senha...
   ✅ Hash gerado

3️⃣ Criando usuário no banco de dados...
   ✅ Usuário criado com sucesso!

════════════════════════════════════════════════════════════

📊 USUÁRIO CRIADO:

   ID: 1
   Nome: Admin Teste
   Email: admin@test.com
   Admin: ✅ Sim

🔑 CREDENCIAIS PARA TESTES:

   Email: admin@test.com
   Senha: Senha123!
```

**Notas:**
- Se usuário já existe, ele avisa e continua
- Use estas credenciais nos testes

---

## 📋 Passo 3: Executar Teste Rápido (Opcional)

Para testar a lógica sem precisar de API:

```bash
cd backend
node teste-desconto-rapido.js
```

**Esperado:**
```
✅ TESTE RÁPIDO: Desconto Percentual

🔬 Teste 1: Lógica de Cálculo

✅ Desconto normal
   Resultado: 93% (esperado: 93%)

✅ Desconto 50%
   Resultado: 50% (esperado: 50%)

...

🎉 LÓGICA DE DESCONTO ESTÁ FUNCIONANDO PERFEITAMENTE!
```

---

## 📋 Passo 4: Executar Testes Completos

Abra **outro terminal** e execute:

```bash
cd backend
node test-desconto-percentual.js
```

### Fase 1: Autenticação
```
🔐 Autenticando...
   📧 Tentando login com admin@test.com...
   ✅ Login realizado com sucesso!
```

### Fase 2: Testes
```
🧪 INICIANDO TESTES DE DESCONTO PERCENTUAL

════════════════════════════════════════════════════════════

✅ Teste 1: Criar produto com desconto válido
────────────────────────────────────────────────────────────
✅ Status HTTP: 201 (esperado: 200)
✅ Desconto: 93 (esperado: 93)
✅ Sem erros na resposta
📊 Resposta: {"success":true,"data":{"id":123,...}}

✅ Teste 2: Atualizar produto com desconto como string
────────────────────────────────────────────────────────────
✅ Status HTTP: 200 (esperado: 200)
✅ Desconto: 50.5 (esperado: 50.5)
✅ Sem erros na resposta
📊 Resposta: {"success":true,"data":{"id":123,...}}

...
```

### Fase 3: Resumo Final
```
📊 RESUMO DOS TESTES

✅ Testes aprovados: 12
❌ Testes falhados: 0
📈 Taxa de sucesso: 100.0%

🎉 TODOS OS TESTES PASSARAM! Desconto percentual está funcionando corretamente.
```

---

## ✅ Sucesso! O que foi testado?

### ✔️ Teste 1: Criar Produto com Desconto Válido
- Envia: `preco: 2100, preco_original: 30000, desconto_percentual: 93`
- Verifica: Produto criado com status 201 ✅
- Valida: Desconto salvo corretamente como 93

### ✔️ Teste 2: Atualizar com Desconto como String
- Envia: `desconto_percentual: "50.5"` (string)
- Verifica: Backend converte para número
- Valida: Sem erro de tipo no PostgreSQL

### ✔️ Teste 3: Limitar Desconto > 100%
- Envia: `desconto_percentual: 150`
- Verifica: Backend limita para 100
- Valida: Nunca ultrapassa 100%

### ✔️ Teste 4: Desconto Inválido
- Envia: `desconto_percentual: "abcd"` (inválido)
- Verifica: Backend converte para 0
- Valida: Sem NaN ou undefined

---

## ❌ Se Algo Falhar

### Erro: "Formato de token inválido"
```
❌ Status HTTP: 401
⚠️  Erro: Formato de token inválido
```

**Solução:**
```bash
# 1. Verifique que o server está rodando
#    Terminal 1: npm run dev

# 2. Crie o usuário novamente
node criar-usuario-teste.js

# 3. Execute novamente
node test-desconto-percentual.js
```

### Erro: "Falha ao conectar"
```
❌ Erro ao autenticar: connect ECONNREFUSED 127.0.0.1:5000
```

**Solução:**
```bash
# 1. Certifique-se que o backend está rodando
ps aux | grep "node server.js"

# 2. Se não estiver, inicie:
npm run dev

# 3. Aguarde 3 segundos e tente novamente
node test-desconto-percentual.js
```

### Erro: "Usuário não encontrado"
```
⚠️  Usuário não existe. Criando usuário de teste...
❌ Erro ao criar usuário: Falha na constraint
```

**Solução:**
```bash
# 1. Verifique se o banco está rodando
# 2. Execute manualmente:
node criar-usuario-teste.js

# 3. Se ainda falhar, crie manualmente:
```

SQL:
```sql
-- Conectar ao banco de dados
\c point55

-- Criar usuário
INSERT INTO usuarios (nome, email, senha, is_admin, data_criacao)
VALUES (
  'Admin Teste',
  'admin@test.com',
  crypt('Senha123!', gen_salt('bf')),
  true,
  NOW()
);
```

---

## 🔧 Configurações Customizadas

### Usar Email/Senha Diferentes
Editar `test-desconto-percentual.js`:
```javascript
const TEST_USER = {
  email: 'seu-email@test.com',
  senha: 'sua-senha'
};
```

### Usar Token Existente
```bash
TEST_TOKEN="seu_jwt_token_aqui" node test-desconto-percentual.js
```

### Testar em Servidor Diferente
```bash
API_URL="http://seu-servidor.com:5000" node test-desconto-percentual.js
```

### Ver Logs Detalhados
```bash
DEBUG=* node test-desconto-percentual.js
```

---

## 📊 Checklist de Validação

- [ ] Servidor backend rodando (`npm run dev`)
- [ ] Banco de dados PostgreSQL acessível
- [ ] Usuário de teste criado
- [ ] Script `test-desconto-percentual.js` executado
- [ ] Todos os testes passaram (100%)
- [ ] Erro "sintaxe de entrada inválida" **NÃO** aparece
- [ ] Status HTTP 200/201 para todos os testes

---

## 📚 Documentação Relacionada

| Arquivo | Descrição |
|---------|-----------|
| [CORRECAO-DESCONTO-PERCENTUAL.md](../CORRECAO-DESCONTO-PERCENTUAL.md) | Documentação técnica completa |
| [GUIA-IMPLEMENTACAO-DESCONTO.md](../GUIA-IMPLEMENTACAO-DESCONTO.md) | Guia visual com fluxogramas |
| [GUIA-TESTES-DESCONTO.md](GUIA-TESTES-DESCONTO.md) | Guia avançado de testes |
| [RESUMO-DESCONTO-PERCENTUAL.md](../RESUMO-DESCONTO-PERCENTUAL.md) | Resumo rápido |

---

## 🎯 Próximas Etapas

Depois de confirmar que tudo funciona:

1. ✅ **Testar no painel de admin** 
   - Acesse http://localhost:3000/admin/produtos
   - Crie um novo produto com desconto

2. ✅ **Testar via frontend**
   - Preencha: Preço Atual = 2100, Preço Original = 30000
   - Sistema deve calcular Desconto = 93%
   - Clique em salvar → deve funcionar!

3. ✅ **Verificar banco de dados**
   ```sql
   SELECT id, nome, preco, preco_original, desconto_percentual 
   FROM produtos 
   WHERE desconto_percentual > 0 
   ORDER BY data_criacao DESC;
   ```

---

## 💡 Dicas Importantes

1. **Sempre inicie o servidor primeiro!**
   - `npm run dev` no terminal 1
   - Espere "Servidor rodando" aparecer

2. **Se algo estiver estranho, reinicie tudo:**
   - Ctrl+C no servidor
   - `npm run dev` novamente
   - Aguarde 3 segundos
   - Execute os testes

3. **Logs são seus amigos:**
   - Verifique o terminal do servidor para erros
   - Verifique o terminal dos testes para detalhes

4. **Token expira?**
   - O script faz login automaticamente
   - Não precisa fazer manualmente

---

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique a seção **❌ Se Algo Falhar** acima
2. Leia [GUIA-TESTES-DESCONTO.md](GUIA-TESTES-DESCONTO.md)
3. Verifique logs do banco de dados
4. Verifique status do servidor (HTTP 500 indicará erros)

---

**Data:** 6 de fevereiro de 2026
**Status:** ✅ Pronto para usar
**Tempo estimado:** 5 minutos
