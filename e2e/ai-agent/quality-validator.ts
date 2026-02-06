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

interface QualityIssue {
  file: string;
  line: number;
  severity: 'crítico' | 'alto' | 'médio' | 'baixo';
  category: string;
  issue: string;
  suggestion: string;
  example?: string;
}

/**
 * Agente de IA para validação de qualidade dos testes
 */
class TestQualityValidator {
  private model: string;
  private testsPath: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.testsPath = path.join(__dirname, '../tests');
  }

  /**
   * Valida qualidade de todos os testes
   */
  async validateAllTests(): Promise<void> {
    console.log('🔍 Validando qualidade dos testes...\n');

    const testFiles = await this.getAllTestFiles();
    console.log(`📄 Total de arquivos de teste: ${testFiles.length}\n`);

    const allIssues: QualityIssue[] = [];

    for (const testFile of testFiles) {
      console.log(`Analisando: ${path.basename(testFile)}`);
      const issues = await this.validateTestFile(testFile);
      allIssues.push(...issues);
      
      if (issues.length > 0) {
        console.log(`  ⚠️  ${issues.length} problemas encontrados`);
      } else {
        console.log(`  ✅ Sem problemas`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    await this.generateQualityReport(allIssues);
  }

  /**
   * Obtém todos os arquivos de teste
   */
  async getAllTestFiles(): Promise<string[]> {
    const files: string[] = [];

    const walkDir = async (dir: string): Promise<void> => {
      if (!(await fs.pathExists(dir))) return;

      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await walkDir(fullPath);
        } else if (item.endsWith('.spec.ts') && !item.includes('debug')) {
          files.push(fullPath);
        }
      }
    };

    await walkDir(this.testsPath);
    return files;
  }

  /**
   * Valida um arquivo de teste específico
   */
  async validateTestFile(filePath: string): Promise<QualityIssue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    const prompt = `
Você é um especialista em qualidade de testes E2E com Playwright.

Analise o seguinte arquivo de teste com MÁXIMO RIGOR:

\`\`\`typescript
${content}
\`\`\`

**CRITÉRIOS DE QUALIDADE A VERIFICAR:**

1. **Estrutura e Organização**
   ✓ Usa test.describe() para agrupar testes relacionados
   ✓ Nomes de testes são descritivos e seguem padrão "deve [ação] [condição]"
   ✓ beforeEach/afterEach usados corretamente
   ✓ Testes organizados por funcionalidade
   ✓ Imports organizados e sem duplicatas

2. **Seletores e Locators**
   ✓ Usa seletores semânticos (role, label, test-id)
   ✓ Evita seletores frágeis (classes CSS, XPath complexo)
   ✓ Usa page.locator() ao invés de page.$()
   ✓ Seletores são reutilizáveis via Page Objects

3. **Asserções**
   ✓ Cada teste tem pelo menos uma asserção
   ✓ Usa asserções apropriadas (toBeVisible, toHaveText, etc)
   ✓ Verifica resultado esperado completo
   ✓ Não usa asserções muito genéricas (toBeTruthy em string)
   ✓ Verifica estados intermediários quando relevante

4. **Esperas e Sincronização**
   ✓ Usa waitFor() ao invés de sleep/timeout fixo
   ✓ Espera por estados de rede (networkidle, load)
   ✓ Usa waitForSelector() quando necessário
   ✓ Timeouts são razoáveis (não muito longos nem curtos)
   ✓ Não tem race conditions

5. **Isolamento e Independência**
   ✓ Cada teste pode rodar independentemente
   ✓ Setup e cleanup adequados
   ✓ Não depende de ordem de execução
   ✓ Limpa dados de teste criados
   ✓ Não compartilha estado entre testes

6. **Dados de Teste**
   ✓ Usa dados dinâmicos (timestamps, UUIDs)
   ✓ Importa de test-data.ts ao invés de hardcode
   ✓ Dados sensíveis em variáveis de ambiente
   ✓ Dados de teste são realistas

7. **Tratamento de Erros**
   ✓ Testa casos de erro explicitamente
   ✓ Verifica mensagens de erro
   ✓ Trata timeouts apropriadamente
   ✓ Screenshots em falhas

8. **Performance**
   ✓ Não tem esperas desnecessárias
   ✓ Reutiliza contexto quando possível
   ✓ Parallelização configurada corretamente
   ✓ Não faz requisições redundantes

9. **Manutenibilidade**
   ✓ Código DRY (não repete lógica)
   ✓ Usa Page Objects para ações complexas
   ✓ Comentários explicam "por quê", não "o quê"
   ✓ Código legível e autoexplicativo
   ✓ Funções auxiliares quando apropriado

10. **Cobertura e Completude**
    ✓ Testa fluxo principal (happy path)
    ✓ Testa casos de erro
    ✓ Testa validações
    ✓ Testa edge cases
    ✓ Testa diferentes estados

11. **Tags e Metadados**
    ✓ Usa tags apropriadas (@smoke, @critical, @regression)
    ✓ Prioridade clara nos testes críticos
    ✓ Anotações para testes lentos (.slow())

12. **Segurança**
    ✓ Não loga senhas ou tokens
    ✓ Não expõe dados sensíveis
    ✓ Testa autorização adequadamente

Para cada problema encontrado, retorne:
- Linha aproximada (número ou "múltiplas")
- Severidade (crítico, alto, médio, baixo)
- Categoria (uma das 12 acima)
- Descrição do problema
- Sugestão de correção
- Exemplo de código correto (quando aplicável)

Retorne no formato JSON:
{
  "score": number, // 0-100
  "issues": [
    {
      "line": number | "múltiplas",
      "severity": "crítico|alto|médio|baixo",
      "category": "...",
      "issue": "...",
      "suggestion": "...",
      "example": "..." // opcional
    }
  ],
  "strengths": ["..."], // pontos fortes do teste
  "summary": "Resumo geral da qualidade"
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em revisão de código de testes automatizados.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia');
      }

      const result = JSON.parse(content);
      
      // Mapeia issues para incluir arquivo
      return (result.issues || []).map((issue: any) => ({
        file: path.basename(filePath),
        line: typeof issue.line === 'number' ? issue.line : 0,
        severity: issue.severity,
        category: issue.category,
        issue: issue.issue,
        suggestion: issue.suggestion,
        example: issue.example,
      }));
    } catch (error) {
      console.error(`❌ Erro ao validar ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Gera relatório de qualidade
   */
  async generateQualityReport(issues: QualityIssue[]): Promise<void> {
    console.log('\n📊 RELATÓRIO DE QUALIDADE DOS TESTES\n');
    console.log('═'.repeat(80));

    // Estatísticas
    const totalIssues = issues.length;
    const bySeverity = {
      crítico: issues.filter(i => i.severity === 'crítico').length,
      alto: issues.filter(i => i.severity === 'alto').length,
      médio: issues.filter(i => i.severity === 'médio').length,
      baixo: issues.filter(i => i.severity === 'baixo').length,
    };

    const byCategory = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 ESTATÍSTICAS\n');
    console.log(`Total de problemas: ${totalIssues}`);
    console.log(`\nPor severidade:`);
    console.log(`  🔴 Críticos: ${bySeverity.crítico}`);
    console.log(`  🟠 Altos: ${bySeverity.alto}`);
    console.log(`  🟡 Médios: ${bySeverity.médio}`);
    console.log(`  🟢 Baixos: ${bySeverity.baixo}`);

    console.log(`\nPor categoria:`);
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });

    // Lista problemas críticos
    const critical = issues.filter(i => i.severity === 'crítico');
    if (critical.length > 0) {
      console.log('\n🔴 PROBLEMAS CRÍTICOS\n');
      critical.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`   Categoria: ${issue.category}`);
        console.log(`   Problema: ${issue.issue}`);
        console.log(`   Sugestão: ${issue.suggestion}`);
        if (issue.example) {
          console.log(`   Exemplo:\n${issue.example.split('\n').map(l => `     ${l}`).join('\n')}`);
        }
        console.log('');
      });
    }

    // Lista problemas altos
    const high = issues.filter(i => i.severity === 'alto');
    if (high.length > 0) {
      console.log('\n🟠 PROBLEMAS DE ALTA PRIORIDADE\n');
      high.slice(0, 10).forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.file}: ${issue.issue}`);
        console.log(`   ${issue.suggestion}\n`);
      });
      if (high.length > 10) {
        console.log(`   ... e mais ${high.length - 10} problemas\n`);
      }
    }

    console.log('\n═'.repeat(80));

    // Recomendações gerais
    console.log('\n💡 RECOMENDAÇÕES GERAIS\n');
    
    if (bySeverity.crítico > 0) {
      console.log('1. 🔴 Corrija IMEDIATAMENTE os problemas críticos');
    }
    if (byCategory['Isolamento e Independência'] > 0) {
      console.log('2. Melhore o isolamento entre testes');
    }
    if (byCategory['Asserções'] > 0) {
      console.log('3. Adicione asserções mais específicas e completas');
    }
    if (byCategory['Seletores e Locators'] > 0) {
      console.log('4. Use seletores mais robustos e semânticos');
    }
    if (byCategory['Manutenibilidade'] > 0) {
      console.log('5. Refatore código duplicado usando Page Objects');
    }

    console.log('');

    // Salva relatório
    const reportPath = path.join(__dirname, '../test-results/quality-report.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeFile(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalIssues,
          bySeverity,
          byCategory,
          issues,
        },
        null,
        2
      )
    );
    console.log(`✅ Relatório salvo em: ${reportPath}\n`);
  }
}

// Execução do script
async function main() {
  const validator = new TestQualityValidator();
  await validator.validateAllTests();
}

// Exporta para uso em outros scripts
export { TestQualityValidator };

// Executa se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}
