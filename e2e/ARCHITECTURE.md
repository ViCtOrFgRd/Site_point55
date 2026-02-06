# 🏗️ Arquitetura do Sistema de Testes E2E com IA

## 📐 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE TESTES E2E                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         PLAYWRIGHT TEST RUNNER          │
        │  • Execução paralela (4 shards)         │
        │  • Multi-browser (Chrome, FF, Safari)   │
        │  • Screenshots, vídeos, traces          │
        └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐     ┌──────────────┐
│  TESTES E2E  │    │ PAGE OBJECTS │     │ AGENTES IA   │
│              │    │              │     │              │
│ • auth       │───▶│ • BasePage   │◀───│ • generate   │
│ • products   │    │ • AuthPage   │    │ • analyze    │
│ • cart       │    │ • ProductPage│    │ • update     │
│ • checkout   │    │ • CartPage   │    │              │
│ • admin      │    │ • CheckoutPg │    │              │
│ • a11y       │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                  │
        └─────────────────────┼──────────────────┘
                              ▼
        ┌──────────────────────────────────────┐
        │      APLICAÇÃO EM TESTE              │
        │                                      │
        │  Frontend (Next.js) ◀──▶ Backend    │
        │       :3000                :5000     │
        │                                      │
        │         PostgreSQL :5432             │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │          RELATÓRIOS                  │
        │  • HTML Report (interativo)          │
        │  • JSON Results                      │
        │  • JUnit XML                         │
        │  • AI Analysis Reports               │
        └──────────────────────────────────────┘
```

## 🔄 Fluxo de Execução de Testes

```
1. INÍCIO
   │
   ▼
2. Configuração do Ambiente
   │ • Carrega .env
   │ • Inicia backend (porta 5000)
   │ • Inicia frontend (porta 3000)
   │ • Conecta banco de dados
   │
   ▼
3. Execução dos Testes
   │ ┌────────────────────────┐
   │ │ Para cada teste:       │
   │ │                        │
   │ │ • beforeEach() setup   │
   │ │ • Executa teste        │
   │ │ • Captura evidências   │
   │ │ • afterEach() cleanup  │
   │ └────────────────────────┘
   │
   ▼
4. Análise de Resultados
   │ ┌─ Sucesso? ───┐
   │ │              │
   │ YES           NO
   │  │             │
   │  │             ▼
   │  │         Agente IA
   │  │         • Analisa erro
   │  │         • Identifica causa
   │  │         • Sugere correção
   │  │
   │  └─────────────┘
   │
   ▼
5. Geração de Relatórios
   │ • HTML interativo
   │ • JSON estruturado
   │ • Relatório IA (se falhas)
   │
   ▼
6. FIM
```

## 🤖 Arquitetura dos Agentes de IA

```
┌────────────────────────────────────────────────────┐
│              OPENAI GPT-4o API                     │
└────────────────────────────────────────────────────┘
                       ▲
                       │ API Calls
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   GERADOR    │ │  ANALISADOR  │ │  ATUALIZADOR │
│              │ │              │ │              │
│ INPUT:       │ │ INPUT:       │ │ INPUT:       │
│ • Página URL │ │ • Test       │ │ • Git diff   │
│ • Componente │ │   results    │ │ • Changed    │
│ • API docs   │ │ • Error msgs │ │   files      │
│              │ │ • Stack      │ │              │
│ OUTPUT:      │ │   traces     │ │ OUTPUT:      │
│ • Test       │ │              │ │ • Updated    │
│   scenarios  │ │ OUTPUT:      │ │   tests      │
│ • TypeScript │ │ • Root cause │ │ • New tests  │
│   code       │ │ • Solutions  │ │ • Coverage   │
│              │ │ • Example    │ │   report     │
│              │ │   code       │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
        ┌──────────────────────────┐
        │  tests/generated/        │
        │  test-results/           │
        │  failure-analysis/       │
        └──────────────────────────┘
```

## 📦 Estrutura de Dados

### Test Scenario (usado pelo Gerador)
```typescript
{
  name: string;           // "deve fazer login com sucesso"
  description: string;    // Descrição detalhada do teste
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];         // ['smoke', 'auth', 'critical']
}
```

### Failure Analysis (usado pelo Analisador)
```typescript
{
  causa: string;          // Causa provável da falha
  solucoes: string[];     // Lista de possíveis soluções
  codigoExemplo: string;  // Código de exemplo corrigido
  prevencao: string;      // Como evitar no futuro
  prioridade: 'crítica' | 'alta' | 'média' | 'baixa';
}
```

### Test Results (formato Playwright)
```json
{
  "suites": [{
    "title": "Suite name",
    "specs": [{
      "title": "Test name",
      "tests": [{
        "results": [{
          "status": "passed|failed|skipped",
          "duration": 1234,
          "error": {
            "message": "...",
            "stack": "..."
          },
          "attachments": [...]
        }]
      }]
    }]
  }]
}
```

## 🔐 Fluxo de Autenticação nos Testes

```
┌────────────────────┐
│  Teste inicia      │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────────┐
│  beforeEach() executa       │
│  • Limpa localStorage       │
│  • Limpa cookies            │
│  • Navega para /login       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  AuthPage.login()           │
│  • Preenche email/senha     │
│  • Clica em "Entrar"        │
│  • Aguarda navegação        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Verifica autenticação      │
│  • URL mudou?               │
│  • Menu de usuário visível? │
│  • Token no localStorage?   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Teste principal executa    │
│  • Usa session autenticada  │
│  • Acessa rotas protegidas  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  afterEach() cleanup        │
│  • Faz logout (se necessário)│
│  • Limpa estado             │
└─────────────────────────────┘
```

## 🎯 Fluxo de Teste do Carrinho

```
Usuário                 Sistema                 Backend
  │                       │                       │
  │  Adiciona produto     │                       │
  │──────────────────────▶│                       │
  │                       │  POST /api/carrinho   │
  │                       │──────────────────────▶│
  │                       │                       │
  │                       │  ◀──── { success }    │
  │  ◀─── Toast success   │                       │
  │                       │                       │
  │  Navega /carrinho     │                       │
  │──────────────────────▶│                       │
  │                       │  GET /api/carrinho    │
  │                       │──────────────────────▶│
  │                       │                       │
  │                       │  ◀──── { items: [...] }
  │  ◀─── Exibe itens     │                       │
  │                       │                       │
  │  Aplica cupom         │                       │
  │──────────────────────▶│                       │
  │                       │  POST /api/cupons     │
  │                       │──────────────────────▶│
  │                       │                       │
  │                       │  ◀──── { desconto }   │
  │  ◀─── Atualiza total  │                       │
  │                       │                       │
  │  Finaliza compra      │                       │
  │──────────────────────▶│                       │
  │                       │  Redireciona          │
  │                       │  /checkout            │
  │  ◀───────────────────│                       │
```

## 🌐 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────┐
│            GitHub Push / Pull Request                │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│         GitHub Actions Workflow Triggered            │
└─────────────────┬───────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┬───────┐
    ▼             ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Shard 1 │ │ Shard 2 │ │ Shard 3 │ │ Shard 4 │  Parallel
│ Tests   │ │ Tests   │ │ Tests   │ │ Tests   │  Execution
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │
     └───────────┴───────────┴───────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  All pass?      │
         └────┬────────┬───┘
              │        │
             YES       NO
              │        │
              │        ▼
              │   ┌─────────────────┐
              │   │  AI Analyzer    │
              │   │  • Analyze      │
              │   │  • Report       │
              │   │  • Comment PR   │
              │   └─────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │  Merge Reports       │
    │  • Combine shards    │
    │  • Generate HTML     │
    │  • Deploy to Pages   │
    └──────────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Notify Team   │
         └─────────────────┘
```

## 📊 Métricas e Monitoramento

```
┌──────────────────────────────────────────────┐
│            DASHBOARD DE MÉTRICAS              │
├──────────────────────────────────────────────┤
│                                               │
│  📊 Taxa de Sucesso: 95%                     │
│  ⏱️  Tempo Médio: 45s                         │
│  🔄 Testes Executados: 127                   │
│  ❌ Falhas: 6                                 │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │  Gráfico de Tendência                │   │
│  │  (últimos 30 dias)                   │   │
│  │                                       │   │
│  │     ✓ ✓ ✓ ✗ ✓ ✓ ✓ ✗ ✓ ✓ ✓ ✓       │   │
│  │                                       │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  Top Falhas:                                 │
│  1. Timeout em checkout (3x)                │
│  2. Seletor não encontrado (2x)             │
│  3. Elemento não clicável (1x)              │
│                                               │
│  Browsers:                                   │
│  🌐 Chrome: 98% sucesso                      │
│  🦊 Firefox: 96% sucesso                     │
│  🧭 Safari: 94% sucesso                      │
│                                               │
└──────────────────────────────────────────────┘
```

## 🔧 Tecnologias e Versões

```
┌─────────────────────────────────────┐
│  STACK TECNOLÓGICO                  │
├─────────────────────────────────────┤
│                                     │
│  Playwright       1.48.0           │
│  TypeScript       5.x               │
│  Node.js          20.x              │
│  OpenAI API       GPT-4o            │
│  Axe-core         4.10.1            │
│  Docker           24.x              │
│  PostgreSQL       15.x (test)       │
│                                     │
└─────────────────────────────────────┘
```

---

Esta arquitetura garante:
- ✅ **Escalabilidade**: Execução paralela
- ✅ **Confiabilidade**: Retry automático
- ✅ **Inteligência**: Análise com IA
- ✅ **Manutenibilidade**: Page Objects
- ✅ **Visibilidade**: Relatórios detalhados
