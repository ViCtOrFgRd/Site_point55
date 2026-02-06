# 🚀 Roadmap - Próximas Melhorias

## 📋 Funcionalidades Recomendadas

### 1. ⏱️ Retry Logic com Backoff Exponencial

**Prioridade:** 🔴 ALTA

**Por quê:** API OpenAI pode falhar temporariamente, retry automático economiza tempo

**Implementação:**
```typescript
private async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) break;
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Tentativa ${attempt}/${maxAttempts} falhou. Aguardando ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usar:
const result = await this.retryWithBackoff(() => openai.chat.completions.create(...));
```

**Benefícios:**
- ✅ Reduz falhas por timeout transitório
- ✅ Melhor taxa de sucesso
- ✅ Melhor experiência do usuário

---

### 2. 🔐 Rate Limiting

**Prioridade:** 🟡 MÉDIA

**Por quê:** Evitar exceder quota da OpenAI e economizar créditos

**Implementação:**
```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private maxTokens: number;
  private refillRate: number; // tokens por segundo

  constructor(maxTokens: number = 10, refillRate: number = 1) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<void> {
    while (this.tokens < tokens) {
      const now = Date.now();
      const timePassed = (now - this.lastRefill) / 1000;
      this.tokens = Math.min(
        this.maxTokens,
        this.tokens + timePassed * this.refillRate
      );

      if (this.tokens < tokens) {
        const waitTime = (tokens - this.tokens) / this.refillRate * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      this.lastRefill = Date.now();
    }

    this.tokens -= tokens;
  }
}
```

**Benefícios:**
- ✅ Controle de requisições por segundo
- ✅ Evita exceder limites de API
- ✅ Garante uso eficiente de créditos

---

### 3. 💾 Caching de Prompts

**Prioridade:** 🟡 MÉDIA

**Por quê:** Evitar custos redundantes gerando mesmos testes

**Implementação:**
```typescript
interface CacheEntry {
  prompt: string;
  response: any;
  timestamp: number;
  cost: number; // em centavos
}

class PromptCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheFile: string;
  private ttl: number = 7 * 24 * 60 * 60 * 1000; // 7 dias

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const cached = JSON.parse(data);
      
      for (const [key, entry] of Object.entries(cached)) {
        const cacheEntry = entry as CacheEntry;
        if (Date.now() - cacheEntry.timestamp < this.ttl) {
          this.cache.set(key, cacheEntry);
        }
      }
    } catch (error) {
      // Cache vazio no início
    }
  }

  async get(prompt: string): Promise<any | null> {
    const hash = this.hashPrompt(prompt);
    return this.cache.get(hash)?.response ?? null;
  }

  async set(prompt: string, response: any, cost: number): Promise<void> {
    const hash = this.hashPrompt(prompt);
    this.cache.set(hash, {
      prompt,
      response,
      timestamp: Date.now(),
      cost,
    });
    await this.save();
  }

  private async save(): Promise<void> {
    const data = Object.fromEntries(this.cache);
    await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2));
  }

  private hashPrompt(prompt: string): string {
    return require('crypto').createHash('sha256').update(prompt).digest('hex');
  }
}
```

**Benefícios:**
- ✅ Reduz custos significativamente
- ✅ Mais rápido (sem esperar API)
- ✅ Permite reutilizar testes

---

### 4. 📊 Telemetria e Custo

**Prioridade:** 🟡 MÉDIA

**Por quê:** Monitorar custos e usar eficientemente

**Implementação:**
```typescript
class CostTracker {
  private costs = {
    'gpt-4': { input: 0.03, output: 0.06 }, // por 1K tokens
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  };

  calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const prices = this.costs[model as keyof typeof this.costs];
    if (!prices) throw new Error(`Modelo desconhecido: ${model}`);

    const inputCost = (inputTokens / 1000) * prices.input;
    const outputCost = (outputTokens / 1000) * prices.output;
    
    return inputCost + outputCost;
  }

  async logUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    operation: string
  ): Promise<void> {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    
    const log = {
      timestamp: new Date().toISOString(),
      model,
      inputTokens,
      outputTokens,
      cost,
      operation,
    };

    await fs.appendFile('cost-log.json', JSON.stringify(log) + '\n');
    
    console.log(`💰 Custo: $${cost.toFixed(4)} - ${operation}`);
  }
}
```

**Benefícios:**
- ✅ Transparência de custos
- ✅ Identifica operações caras
- ✅ Otimiza prompts para reduzir tokens

---

### 5. 🧪 Testes Unitários

**Prioridade:** 🟢 BAIXA

**Por quê:** Garantir confiabilidade dos agentes

**Exemplo:**
```typescript
import { describe, it, expect } from '@jest/globals';
import { TestGeneratorAgent } from './generate-tests';

describe('TestGeneratorAgent', () => {
  let agent: TestGeneratorAgent;

  beforeEach(() => {
    agent = new TestGeneratorAgent();
  });

  it('deve validar API key', () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => new TestGeneratorAgent()).toThrow();
  });

  it('deve gerar testes para página válida', async () => {
    // Mock OpenAI
    const result = await agent.analyzePageAndGenerateTests('/produtos', 'products');
    expect(result).toBeDefined();
  });

  it('deve validar formato de cenários', async () => {
    const scenarios = [
      {
        name: 'Teste 1',
        description: 'Descrição',
        priority: 'critical' as const,
        tags: ['smoke'],
      },
    ];
    
    expect(scenarios[0].priority).toBe('critical');
  });
});
```

---

### 6. 📝 Logging Estruturado

**Prioridade:** 🟢 BAIXA

**Por quê:** Melhor debugging e auditoria

**Implementação com Winston:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Usar:
logger.info('Iniciando geração de testes', { page: '/produtos' });
logger.error('Erro ao processar', { error: err.message });
```

---

### 7. 🔄 Gerador de Testes Incremental

**Prioridade:** 🔴 ALTA

**Por quê:** Não regenerar testes já existentes

**Ideia:**
```typescript
async shouldRegenerate(pageName: string): Promise<boolean> {
  const testFile = path.join(this.outputDir, `${pageName}.spec.ts`);
  const exists = await fs.pathExists(testFile);
  
  if (!exists) return true;

  // Verificar timestamp
  const stats = await fs.stat(testFile);
  const age = Date.now() - stats.mtime.getTime();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

  return age > maxAge;
}
```

---

### 8. 🎛️ Dashboard de Monitoramento

**Prioridade:** 🟢 BAIXA

**Por quê:** Visualizar status dos testes em tempo real

**Stack Recomendada:**
- Express.js para API
- React para Dashboard
- WebSocket para atualizações em tempo real
- PostgreSQL para armazenar histórico

---

## 📊 Matriz de Priorização

| Funcionalidade | Impacto | Esforço | Prioridade |
|---|---|---|---|
| Retry Logic | 🔴 Alto | 🟢 Baixo | 🔴 ALTA |
| Rate Limiting | 🔴 Alto | 🟡 Médio | 🟡 MÉDIA |
| Cache | 🔴 Alto | 🟡 Médio | 🟡 MÉDIA |
| Telemetria | 🟡 Médio | 🟢 Baixo | 🟡 MÉDIA |
| Testes Unit. | 🟡 Médio | 🔴 Alto | 🟢 BAIXA |
| Logging | 🟡 Médio | 🟢 Baixo | 🟢 BAIXA |
| Incremental | 🔴 Alto | 🟡 Médio | 🔴 ALTA |
| Dashboard | 🟢 Baixo | 🔴 Alto | 🟢 BAIXA |

---

## 🗺️ Roadmap Temporal

### Q1 2026
- [ ] Implementar Retry Logic
- [ ] Adicionar Rate Limiting
- [ ] Criar testes unitários básicos

### Q2 2026
- [ ] Implementar Cache de Prompts
- [ ] Adicionar Telemetria
- [ ] Melhorar Logging

### Q3 2026
- [ ] Gerador Incremental
- [ ] Integração com CI/CD
- [ ] Documentação Completa

### Q4 2026
- [ ] Dashboard de Monitoramento
- [ ] Performance Optimization
- [ ] Enterprise Features

---

## 💪 Como Contribuir

1. **Escolher uma funcionalidade** do roadmap
2. **Criar uma branch:** `git checkout -b feat/retry-logic`
3. **Implementar com testes**
4. **Enviar PR** com descrição clara
5. **Revisar e mergear**

---

## 📞 Suporte

Dúvidas ou sugestões?
- 📧 Email: dev@k2on.casa
- 💬 Discord: [Link]
- 📋 Issues: GitHub Issues

