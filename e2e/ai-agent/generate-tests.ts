import OpenAI from 'openai';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY não configurada no arquivo .env');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TestScenario {
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
}

/**
 * Agente de IA para geração automática de testes E2E
 */
class TestGeneratorAgent {
  private model: string;
  private outputDir: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.outputDir = path.join(__dirname, '../tests/generated');
  }

  /**
   * Analisa uma página e gera cenários de teste
   */
  async analyzePageAndGenerateTests(pageUrl: string, pageName: string): Promise<void> {
    console.log(`🤖 Analisando página: ${pageUrl}`);
    
    const prompt = `
Você é um especialista em testes automatizados E2E com Playwright.

Analise a seguinte página de um e-commerce: ${pageName} (URL: ${pageUrl})

Gere uma lista completa de cenários de teste que devem ser cobertos para esta página.
Considere:
- Casos de sucesso
- Casos de erro
- Validações de campos
- Casos limite (edge cases)
- Acessibilidade
- Responsividade
- Performance

Retorne no formato JSON:
{
  "scenarios": [
    {
      "name": "Nome do teste",
      "description": "Descrição detalhada",
      "priority": "critical|high|medium|low",
      "tags": ["tag1", "tag2"]
    }
  ]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em QA e testes automatizados E2E.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      let result;
      try {
        result = JSON.parse(content);
        if (!result.scenarios || !Array.isArray(result.scenarios)) {
          throw new Error('Formato de resposta inválido: scenarios não é um array');
        }
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', content);
        throw new Error('Resposta da API em formato inválido');
      }

      console.log(`✅ ${result.scenarios.length} cenários gerados para ${pageName}`);

      // Gera código dos testes
      await this.generateTestCode(pageName, result.scenarios);
    } catch (error) {
      console.error('❌ Erro ao gerar testes:', error);
      throw error;
    }
  }

  /**
   * Gera código TypeScript dos testes
   */
  async generateTestCode(pageName: string, scenarios: TestScenario[]): Promise<void> {
    const prompt = `
Você é um especialista em Playwright e TypeScript.

Gere o código completo de testes E2E em TypeScript para os seguintes cenários:

${JSON.stringify(scenarios, null, 2)}

Requisitos:
- Use Playwright Test Framework
- Use Page Object Model (importe de '../helpers/page-objects/')
- Use dados de teste de '../helpers/test-data'
- Inclua tags apropriadas (@smoke, @critical, etc)
- Inclua asserções adequadas
- Use async/await corretamente
- Adicione comentários explicativos
- Siga boas práticas de testes E2E

Nome do arquivo: ${pageName}.spec.ts

Gere o código completo do arquivo.
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em desenvolvimento de testes automatizados.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const testCode = response.choices[0].message.content;
      if (!testCode) {
        throw new Error('Código de teste não gerado');
      }

      // Salva o arquivo
      await fs.ensureDir(this.outputDir);
      const filePath = path.join(this.outputDir, `${pageName}.spec.ts`);
      await fs.writeFile(filePath, testCode);

      // Valida se arquivo foi criado
      const exists = await fs.pathExists(filePath);
      if (exists) {
        const stats = await fs.stat(filePath);
        console.log(`✅ Teste gerado: ${filePath} (${stats.size} bytes)`);
      } else {
        throw new Error(`Falha ao criar arquivo: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar código:', error);
      throw error;
    }
  }

  /**
   * Analisa um componente e gera testes
   */
  async analyzeComponentAndGenerateTests(
    componentPath: string,
    componentCode: string
  ): Promise<void> {
    console.log(`🤖 Analisando componente: ${componentPath}`);

    const prompt = `
Você é um especialista em testes de frontend.

Analise o seguinte componente React/Next.js:

\`\`\`typescript
${componentCode}
\`\`\`

Gere cenários de teste E2E que validam:
- Renderização do componente
- Interações do usuário
- Estados diferentes
- Props diferentes
- Casos de erro
- Acessibilidade

Retorne no formato JSON com a lista de cenários.
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em testes de componentes React.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia');
      }

      const result = JSON.parse(content);
      const componentName = path.basename(componentPath, path.extname(componentPath));
      
      await this.generateTestCode(componentName, result.scenarios);
    } catch (error) {
      console.error('❌ Erro ao analisar componente:', error);
      throw error;
    }
  }

  /**
   * Gera testes baseado em documentação de API
   */
  async generateAPITests(apiDocs: string): Promise<void> {
    console.log('🤖 Gerando testes de API...');

    const prompt = `
Analise a seguinte documentação de API:

${apiDocs}

Gere testes E2E que validam:
- Requisições bem-sucedidas
- Tratamento de erros
- Validação de dados
- Autenticação/Autorização
- Casos limite

Retorne cenários de teste no formato JSON.
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em testes de API.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia');
      }

      const result = JSON.parse(content);
      await this.generateTestCode('api-integration', result.scenarios);
    } catch (error) {
      console.error('❌ Erro ao gerar testes de API:', error);
      throw error;
    }
  }

  /**
   * Atualiza testes existentes baseado em mudanças de código
   */
  async updateTestsBasedOnChanges(
    oldCode: string,
    newCode: string,
    testPath: string
  ): Promise<void> {
    console.log(`🤖 Atualizando testes baseado em mudanças...`);

    const prompt = `
Você é um especialista em manutenção de testes.

O código foi alterado de:
\`\`\`
${oldCode}
\`\`\`

Para:
\`\`\`
${newCode}
\`\`\`

Analise as mudanças e determine:
1. Quais testes precisam ser atualizados?
2. Novos testes precisam ser criados?
3. Algum teste ficou obsoleto?

Retorne no formato JSON:
{
  "testsToUpdate": ["nome1", "nome2"],
  "testsToCreate": [{"name": "...", "description": "..."}],
  "testsToRemove": ["nome3"]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em manutenção de código de testes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia');
      }

      const result = JSON.parse(content);
      console.log('📊 Análise de mudanças:', result);

      // TODO: Implementar lógica de atualização automática
    } catch (error) {
      console.error('❌ Erro ao analisar mudanças:', error);
      throw error;
    }
  }
}

// Execução do script
async function main() {
  const agent = new TestGeneratorAgent();

  // Páginas principais para gerar testes
  const pages = [
    { url: '/produtos', name: 'product-listing' },
    { url: '/produtos/:id', name: 'product-detail' },
    { url: '/carrinho', name: 'cart' },
    { url: '/checkout', name: 'checkout' },
    { url: '/login', name: 'login' },
    { url: '/registro', name: 'register' },
    { url: '/perfil', name: 'profile' },
    { url: '/pedidos', name: 'orders' },
    { url: '/admin', name: 'admin-dashboard' },
  ];

  console.log('🚀 Iniciando geração automática de testes...\n');

  for (const page of pages) {
    try {
      await agent.analyzePageAndGenerateTests(page.url, page.name);
      console.log('');
    } catch (error) {
      console.error(`Erro ao processar ${page.name}:`, error);
    }
  }

  console.log('\n✅ Geração de testes concluída!');
}

// Exporta para uso em outros scripts
export { TestGeneratorAgent };

// Executa se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}
