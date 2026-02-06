import OpenAI from 'openai';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY não configurada no arquivo .env');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CoverageReport {
  totalPages: number;
  testedPages: number;
  coveragePercentage: number;
  missingTests: string[];
  incompleteTests: Array<{
    page: string;
    missingScenarios: string[];
  }>;
  recommendations: string[];
}

/**
 * Agente de IA para análise de cobertura de testes
 */
class CoverageAnalyzerAgent {
  private model: string;
  private projectRoot: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.projectRoot = path.join(__dirname, '../..');
  }

  /**
   * Analisa cobertura completa do sistema
   */
  async analyzeCoverage(): Promise<void> {
    console.log('🔍 Analisando cobertura de testes do sistema completo...\n');

    // 1. Identifica todas as páginas
    const allPages = await this.getAllPages();
    console.log(`📄 Total de páginas encontradas: ${allPages.length}`);

    // 2. Identifica testes existentes
    const existingTests = await this.getExistingTests();
    console.log(`✅ Testes existentes: ${existingTests.length}`);

    // 3. Identifica todas as rotas de API
    const allRoutes = await this.getAllAPIRoutes();
    console.log(`🌐 Total de rotas de API: ${allRoutes.length}\n`);

    // 4. Analisa gaps de cobertura
    const gaps = await this.analyzeGaps(allPages, existingTests, allRoutes);
    
    // 5. Gera relatório
    await this.generateReport(gaps);

    // 6. Sugere novos testes
    await this.suggestNewTests(gaps);
  }

  /**
   * Identifica todas as páginas do frontend
   */
  async getAllPages(): Promise<Array<{ path: string; file: string }>> {
    const frontendPath = path.join(this.projectRoot, 'frontend/src/app');
    const pages: Array<{ path: string; file: string }> = [];

    const walkDir = async (dir: string, basePath: string = ''): Promise<void> => {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await walkDir(fullPath, path.join(basePath, file));
        } else if (file === 'page.tsx' || file === 'page.ts') {
          const routePath = basePath
            .replace(/\[([^\]]+)\]/g, ':$1') // [id] -> :id
            .replace(/\\/g, '/') || '/';
          pages.push({
            path: routePath,
            file: fullPath,
          });
        }
      }
    };

    if (await fs.pathExists(frontendPath)) {
      await walkDir(frontendPath);
    }

    return pages;
  }

  /**
   * Identifica testes existentes
   */
  async getExistingTests(): Promise<Array<{ name: string; file: string }>> {
    const testsPath = path.join(__dirname, '../tests');
    const tests: Array<{ name: string; file: string }> = [];

    if (!(await fs.pathExists(testsPath))) {
      return tests;
    }

    const walkDir = async (dir: string): Promise<void> => {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await walkDir(fullPath);
        } else if (file.endsWith('.spec.ts')) {
          tests.push({
            name: file.replace('.spec.ts', ''),
            file: fullPath,
          });
        }
      }
    };

    await walkDir(testsPath);
    return tests;
  }

  /**
   * Identifica todas as rotas de API
   */
  async getAllAPIRoutes(): Promise<Array<{ method: string; path: string; file: string }>> {
    const backendPath = path.join(this.projectRoot, 'backend/routes');
    const routes: Array<{ method: string; path: string; file: string }> = [];

    if (!(await fs.pathExists(backendPath))) {
      return routes;
    }

    const files = await fs.readdir(backendPath);

    for (const file of files) {
      if (!file.endsWith('.js')) continue;

      const fullPath = path.join(backendPath, file);
      const content = await fs.readFile(fullPath, 'utf-8');

      // Extrai rotas do arquivo
      const routeMatches = content.matchAll(/router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g);
      
      for (const match of routeMatches) {
        const [, method, routePath] = match;
        routes.push({
          method: method.toUpperCase(),
          path: `/api/${file.replace('.js', '')}${routePath}`,
          file: fullPath,
        });
      }
    }

    return routes;
  }

  /**
   * Analisa gaps de cobertura usando IA
   */
  async analyzeGaps(
    pages: Array<{ path: string; file: string }>,
    tests: Array<{ name: string; file: string }>,
    routes: Array<{ method: string; path: string; file: string }>
  ): Promise<any> {
    console.log('🤖 Analisando gaps de cobertura com IA...\n');

    const prompt = `
Você é um especialista em análise de cobertura de testes para e-commerce.

**Sistema analisado: Point55 E-commerce**

**Páginas do sistema (${pages.length}):**
${pages.map(p => `- ${p.path}`).join('\n')}

**Testes existentes (${tests.length}):**
${tests.map(t => `- ${t.name}`).join('\n')}

**Rotas de API (${routes.length}):**
${routes.map(r => `- ${r.method} ${r.path}`).join('\n')}

**ANALISE DETALHADAMENTE:**

1. **Cobertura de Páginas**
   - Quais páginas NÃO têm testes?
   - Quais páginas têm cobertura incompleta?
   - Quais cenários estão faltando em cada página?

2. **Cobertura de API**
   - Quais rotas NÃO são testadas?
   - Quais métodos HTTP não têm cobertura?
   - Quais validações de API estão faltando?

3. **Fluxos End-to-End**
   - Quais jornadas de usuário não são testadas?
   - Quais integrações entre páginas estão faltando?
   - Quais fluxos críticos de negócio não têm cobertura?

4. **Cenários Específicos**
   - Autenticação e autorização
   - Carrinho de compras
   - Checkout e pagamento
   - Gestão de produtos
   - Área administrativa
   - Gestão de pedidos

5. **Edge Cases e Validações**
   - Quais validações não são testadas?
   - Quais casos de erro faltam?
   - Quais casos limite não têm cobertura?

6. **Prioridades**
   - Classifique os gaps por prioridade (crítica, alta, média, baixa)
   - Identifique riscos de não ter cobertura
   - Sugira ordem de implementação

Retorne no formato JSON detalhado:
{
  "resumo": {
    "totalPaginas": number,
    "paginasTestadas": number,
    "coberturaPaginas": number,
    "totalRotas": number,
    "rotasTestadas": number,
    "coberturaRotas": number
  },
  "paginasSemTestes": [
    {
      "path": "...",
      "prioridade": "crítica|alta|média|baixa",
      "razao": "...",
      "risco": "..."
    }
  ],
  "paginasComCoberturaIncompleta": [
    {
      "path": "...",
      "testesExistentes": ["..."],
      "cenariosAusentes": ["..."],
      "prioridade": "..."
    }
  ],
  "rotasSemTestes": [
    {
      "method": "...",
      "path": "...",
      "prioridade": "...",
      "validacoesNecessarias": ["..."]
    }
  ],
  "fluxosAusentes": [
    {
      "nome": "...",
      "descricao": "...",
      "paginas": ["..."],
      "prioridade": "...",
      "impactoNegocio": "..."
    }
  ],
  "recomendacoes": [
    {
      "prioridade": "...",
      "area": "...",
      "acao": "...",
      "justificativa": "..."
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
            content: 'Você é um especialista em análise de cobertura de testes e QA.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Erro ao analisar gaps:', error);
      throw error;
    }
  }

  /**
   * Gera relatório de cobertura
   */
  async generateReport(analysis: any): Promise<void> {
    console.log('\n📊 RELATÓRIO DE COBERTURA\n');
    console.log('═'.repeat(80));

    // Resumo
    console.log('\n📈 RESUMO GERAL\n');
    console.log(`Páginas:`);
    console.log(`  Total: ${analysis.resumo?.totalPaginas || 0}`);
    console.log(`  Testadas: ${analysis.resumo?.paginasTestadas || 0}`);
    console.log(`  Cobertura: ${analysis.resumo?.coberturaPaginas || 0}%\n`);

    console.log(`Rotas de API:`);
    console.log(`  Total: ${analysis.resumo?.totalRotas || 0}`);
    console.log(`  Testadas: ${analysis.resumo?.rotasTestadas || 0}`);
    console.log(`  Cobertura: ${analysis.resumo?.coberturaRotas || 0}%\n`);

    // Páginas sem testes
    if (analysis.paginasSemTestes?.length > 0) {
      console.log('\n⚠️  PÁGINAS SEM TESTES\n');
      analysis.paginasSemTestes.forEach((page: any, i: number) => {
        console.log(`${i + 1}. ${page.path}`);
        console.log(`   Prioridade: ${page.prioridade}`);
        console.log(`   Razão: ${page.razao}`);
        console.log(`   Risco: ${page.risco}\n`);
      });
    }

    // Cobertura incompleta
    if (analysis.paginasComCoberturaIncompleta?.length > 0) {
      console.log('\n⚡ PÁGINAS COM COBERTURA INCOMPLETA\n');
      analysis.paginasComCoberturaIncompleta.forEach((page: any, i: number) => {
        console.log(`${i + 1}. ${page.path}`);
        console.log(`   Cenários ausentes:`);
        page.cenariosAusentes?.forEach((c: string) => console.log(`     - ${c}`));
        console.log('');
      });
    }

    // Fluxos ausentes
    if (analysis.fluxosAusentes?.length > 0) {
      console.log('\n🔄 FLUXOS END-TO-END AUSENTES\n');
      analysis.fluxosAusentes.forEach((fluxo: any, i: number) => {
        console.log(`${i + 1}. ${fluxo.nome}`);
        console.log(`   ${fluxo.descricao}`);
        console.log(`   Prioridade: ${fluxo.prioridade}`);
        console.log(`   Impacto: ${fluxo.impactoNegocio}\n`);
      });
    }

    // Recomendações
    if (analysis.recomendacoes?.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES\n');
      analysis.recomendacoes
        .sort((a: any, b: any) => {
          const priorities = { crítica: 0, alta: 1, média: 2, baixa: 3 };
          return (priorities[a.prioridade as keyof typeof priorities] || 999) - 
                 (priorities[b.prioridade as keyof typeof priorities] || 999);
        })
        .forEach((rec: any, i: number) => {
          console.log(`${i + 1}. [${rec.prioridade.toUpperCase()}] ${rec.area}`);
          console.log(`   Ação: ${rec.acao}`);
          console.log(`   Justificativa: ${rec.justificativa}\n`);
        });
    }

    console.log('═'.repeat(80));

    // Salva relatório em arquivo
    const reportPath = path.join(__dirname, '../test-results/coverage-report.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeFile(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`\n✅ Relatório salvo em: ${reportPath}\n`);
  }

  /**
   * Sugere novos testes baseado nos gaps
   */
  async suggestNewTests(analysis: any): Promise<void> {
    console.log('💡 Gerando sugestões de novos testes...\n');

    const suggestions = [];

    // Prioriza por criticidade
    const criticalGaps = [
      ...(analysis.paginasSemTestes || []).filter((p: any) => p.prioridade === 'crítica'),
      ...(analysis.fluxosAusentes || []).filter((f: any) => f.prioridade === 'crítica'),
    ];

    if (criticalGaps.length > 0) {
      console.log('🔴 TESTES CRÍTICOS A IMPLEMENTAR:\n');
      criticalGaps.forEach((gap: any, i: number) => {
        console.log(`${i + 1}. ${gap.path || gap.nome}`);
        console.log(`   ${gap.razao || gap.descricao}\n`);
      });
    }

    // Salva sugestões
    const suggestionsPath = path.join(__dirname, '../test-results/test-suggestions.json');
    await fs.writeFile(suggestionsPath, JSON.stringify(analysis, null, 2));
    console.log(`✅ Sugestões salvas em: ${suggestionsPath}\n`);
  }
}

// Execução do script
async function main() {
  const agent = new CoverageAnalyzerAgent();
  await agent.analyzeCoverage();
}

// Exporta para uso em outros scripts
export { CoverageAnalyzerAgent };

// Executa se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}
