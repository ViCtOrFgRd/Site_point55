import OpenAI from 'openai';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TestFailure {
  testName: string;
  errorMessage: string;
  stackTrace: string;
  screenshot?: string;
}

/**
 * Agente de IA para análise de falhas de testes
 */
class FailureAnalysisAgent {
  private model: string;
  private resultsPath: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.resultsPath = path.join(__dirname, '../test-results/results.json');
  }

  /**
   * Analisa falhas de testes e sugere correções
   */
  async analyzeFailures(): Promise<void> {
    console.log('🤖 Analisando falhas de testes...\n');

    // Lê resultados dos testes
    const results = await this.loadTestResults();
    const failures = this.extractFailures(results);

    if (failures.length === 0) {
      console.log('✅ Nenhuma falha encontrada!');
      return;
    }

    console.log(`❌ ${failures.length} falhas encontradas\n`);

    // Analisa cada falha
    for (const failure of failures) {
      await this.analyzeFailure(failure);
      console.log('\n---\n');
    }

    // Gera relatório consolidado
    await this.generateFailureReport(failures);
  }

  /**
   * Carrega resultados dos testes
   */
  async loadTestResults(): Promise<any> {
    const exists = await fs.pathExists(this.resultsPath);
    if (!exists) {
      console.warn(`⚠️ Arquivo de resultados não encontrado: ${this.resultsPath}`);
      return { suites: [] };
    }

    try {
      const content = await fs.readFile(this.resultsPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Erro ao carregar resultados:', error);
      throw error;
    }
  }

  /**
   * Extrai falhas dos resultados
   */
  extractFailures(results: any): TestFailure[] {
    const failures: TestFailure[] = [];

    if (results.suites) {
      for (const suite of results.suites) {
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            for (const result of test.results || []) {
              if (result.status === 'failed') {
                failures.push({
                  testName: `${suite.title} > ${spec.title}`,
                  errorMessage: result.error?.message || 'Erro desconhecido',
                  stackTrace: result.error?.stack || '',
                  screenshot: result.attachments?.find((a: any) => a.name === 'screenshot')?.path,
                });
              }
            }
          }
        }
      }
    }

    return failures;
  }

  /**
   * Analisa uma falha específica
   */
  async analyzeFailure(failure: TestFailure): Promise<void> {
    console.log(`📋 Analisando: ${failure.testName}`);

    const prompt = `
Você é um especialista em debug de testes E2E com Playwright.

Analise a seguinte falha de teste:

**Teste:** ${failure.testName}

**Erro:**
${failure.errorMessage}

**Stack Trace:**
${failure.stackTrace}

Forneça:
1. **Causa provável** da falha
2. **Possíveis soluções** (pelo menos 3)
3. **Código de exemplo** para corrigir o problema
4. **Prevenção** - como evitar este tipo de erro no futuro
5. **Prioridade** (crítica, alta, média, baixa)

Seja específico e prático. Retorne no formato JSON:
{
  "causa": "...",
  "solucoes": ["solução 1", "solução 2", "solução 3"],
  "codigoExemplo": "...",
  "prevencao": "...",
  "prioridade": "crítica|alta|média|baixa"
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em debug e correção de testes automatizados.',
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

      const analysis = JSON.parse(content);
      
      console.log(`\n🔍 Causa: ${analysis.causa}`);
      console.log(`\n💡 Soluções:`);
      analysis.solucoes.forEach((sol: string, i: number) => {
        console.log(`   ${i + 1}. ${sol}`);
      });
      console.log(`\n📝 Código de exemplo:\n${analysis.codigoExemplo}`);
      console.log(`\n🛡️ Prevenção: ${analysis.prevencao}`);
      console.log(`\n⚠️ Prioridade: ${analysis.prioridade.toUpperCase()}`);

      // Salva análise
      await this.saveAnalysis(failure.testName, analysis);
    } catch (error) {
      console.error('❌ Erro ao analisar falha:', error);
    }
  }

  /**
   * Salva análise de falha
   */
  async saveAnalysis(testName: string, analysis: any): Promise<void> {
    const analysisDir = path.join(__dirname, '../test-results/failure-analysis');
    await fs.ensureDir(analysisDir);

    const fileName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = path.join(analysisDir, `${fileName}.json`);

    await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
  }

  /**
   * Gera relatório consolidado
   */
  async generateFailureReport(failures: TestFailure[]): Promise<void> {
    console.log('\n📊 Gerando relatório consolidado...');

    const prompt = `
Você é um especialista em QA.

Analise as seguintes falhas de testes e gere um relatório executivo:

${failures.map(f => `- ${f.testName}: ${f.errorMessage}`).join('\n')}

O relatório deve conter:
1. **Resumo** das falhas
2. **Padrões identificados** (falhas semelhantes)
3. **Áreas críticas** que precisam atenção
4. **Recomendações** de ações prioritárias
5. **Métricas** (taxa de sucesso, tempo médio, etc)

Retorne em formato Markdown.
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em relatórios de QA.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const report = response.choices[0].message.content || '';

      const reportPath = path.join(__dirname, '../test-results/failure-report.md');
      await fs.writeFile(reportPath, report);

      console.log(`✅ Relatório salvo em: ${reportPath}`);
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
    }
  }

  /**
   * Sugere melhorias nos testes
   */
  async suggestTestImprovements(testCode: string, testName: string): Promise<void> {
    console.log(`🤖 Analisando teste: ${testName}`);

    const prompt = `
Você é um especialista em qualidade de código de testes.

Analise o seguinte código de teste:

\`\`\`typescript
${testCode}
\`\`\`

Forneça sugestões de melhoria sobre:
- Legibilidade
- Manutenibilidade
- Robustez (flaky tests)
- Performance
- Boas práticas
- Cobertura de casos limite

Retorne em formato JSON com lista de sugestões e código melhorado.
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em revisão de código de testes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia');
      }

      const suggestions = JSON.parse(content);
      
      console.log('\n💡 Sugestões de melhoria:');
      suggestions.sugestoes?.forEach((sug: string, i: number) => {
        console.log(`   ${i + 1}. ${sug}`);
      });

      if (suggestions.codigoMelhorado) {
        const improvedPath = path.join(__dirname, '../test-results/improved-tests', `${testName}.ts`);
        await fs.ensureDir(path.dirname(improvedPath));
        await fs.writeFile(improvedPath, suggestions.codigoMelhorado);
        console.log(`\n✅ Código melhorado salvo em: ${improvedPath}`);
      }
    } catch (error) {
      console.error('❌ Erro ao analisar teste:', error);
    }
  }
}

// Execução do script
async function main() {
  const agent = new FailureAnalysisAgent();
  await agent.analyzeFailures();
}

// Exporta para uso em outros scripts
export { FailureAnalysisAgent };

// Executa se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}
