import { TestGeneratorAgent } from './generate-tests';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Agente de IA para atualização automática de testes
 */
class TestUpdateAgent {
  private generator: TestGeneratorAgent;
  private projectRoot: string;

  constructor() {
    this.generator = new TestGeneratorAgent();
    this.projectRoot = path.join(__dirname, '../..');
  }

  /**
   * Monitora mudanças no código e atualiza testes
   */
  async watchAndUpdate(): Promise<void> {
    console.log('👁️ Monitorando mudanças no código...\n');

    // Obtém lista de arquivos alterados (via git)
    const changedFiles = this.getChangedFiles();

    if (changedFiles.length === 0) {
      console.log('✅ Nenhuma mudança detectada');
      return;
    }

    console.log(`📝 ${changedFiles.length} arquivos alterados:\n`);
    changedFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');

    // Analisa cada arquivo alterado
    for (const file of changedFiles) {
      await this.processChangedFile(file);
    }

    console.log('\n✅ Atualização de testes concluída!');
  }

  /**
   * Obtém lista de arquivos alterados
   */
  getChangedFiles(): string[] {
    try {
      // Arquivos alterados não commitados
      const output = execSync('git diff --name-only HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 10000,
      });

      return output
        .split('\n')
        .filter(file => file.trim() !== '')
        .filter(file => {
          // Filtra apenas arquivos relevantes
          return (
            file.includes('frontend/src/') ||
            file.includes('backend/') ||
            file.endsWith('.tsx') ||
            file.endsWith('.ts') ||
            file.endsWith('.js')
          );
        })
        .filter(file => !file.includes('e2e/')); // Ignora próprios testes
    } catch (error) {
      console.error('Erro ao obter arquivos alterados:', error);
      return [];
    }
  }

  /**
   * Processa arquivo alterado
   */
  async processChangedFile(filePath: string): Promise<void> {
    console.log(`\n🔄 Processando: ${filePath}`);

    const fullPath = path.join(this.projectRoot, filePath);

    // Verifica se é componente React
    if (filePath.includes('frontend/src/components/')) {
      await this.updateComponentTest(fullPath);
    }
    // Verifica se é página
    else if (filePath.includes('frontend/src/app/')) {
      await this.updatePageTest(fullPath);
    }
    // Verifica se é controller/rota do backend
    else if (filePath.includes('backend/controllers/') || filePath.includes('backend/routes/')) {
      await this.updateAPITest(fullPath);
    }
  }

  /**
   * Atualiza teste de componente
   */
  async updateComponentTest(componentPath: string): Promise<void> {
    try {
      const componentCode = await fs.readFile(componentPath, 'utf-8');
      await this.generator.analyzeComponentAndGenerateTests(componentPath, componentCode);
      console.log('✅ Teste de componente atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar teste de componente:', error);
    }
  }

  /**
   * Atualiza teste de página
   */
  async updatePageTest(pagePath: string): Promise<void> {
    try {
      // Extrai rota da página
      const route = this.extractRouteFromPath(pagePath);
      const pageName = path.basename(path.dirname(pagePath));

      await this.generator.analyzePageAndGenerateTests(route, pageName);
      console.log('✅ Teste de página atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar teste de página:', error);
    }
  }

  /**
   * Atualiza teste de API
   */
  async updateAPITest(apiPath: string): Promise<void> {
    try {
      const apiCode = await fs.readFile(apiPath, 'utf-8');
      
      // Extrai informações da API
      const apiDocs = this.extractAPIDocumentation(apiCode, apiPath);
      
      await this.generator.generateAPITests(apiDocs);
      console.log('✅ Teste de API atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar teste de API:', error);
    }
  }

  /**
   * Extrai rota do caminho do arquivo
   */
  extractRouteFromPath(filePath: string): string {
    // Exemplo: frontend/src/app/produtos/[id]/page.tsx -> /produtos/:id
    let match = filePath.match(/app\/(.+)\/page\.(tsx|ts|jsx|js)/);
    
    if (!match) {
      match = filePath.match(/pages\/(.+)\.(tsx|ts|jsx|js)/);
    }

    if (!match) {
      console.warn(`⚠️ Não foi possível extrair rota de: ${filePath}`);
      return '/';
    }

    let route = '/' + match[1];
    // Converte [id] para :id
    route = route.replace(/\[(\w+)\]/g, ':$1');
    return route;
  }

  /**
   * Extrai documentação da API do código
   */
  extractAPIDocumentation(code: string, filePath: string): string {
    const fileName = path.basename(filePath);
    
    // Extrai rotas, métodos, middlewares
    const routes = code.match(/router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g) || [];
    const middlewares = code.match(/authenticate|isAdmin|authorize/g) || [];
    
    return `
Arquivo: ${fileName}

Rotas identificadas:
${routes.join('\n')}

Middlewares:
${middlewares.join(', ')}

Código completo:
${code.substring(0, 2000)}...
`;
  }

  /**
   * Executa testes e verifica cobertura
   */
  async verifyTestCoverage(): Promise<void> {
    console.log('\n📊 Verificando cobertura de testes...\n');

    try {
      // Lista todos os arquivos de teste
      const testFiles = await this.getTestFiles();
      
      // Lista todos os arquivos de código
      const sourceFiles = await this.getSourceFiles();

      // Identifica arquivos sem testes
      const untested = this.findUntestedFiles(sourceFiles, testFiles);

      if (untested.length > 0) {
        console.log(`⚠️ ${untested.length} arquivos sem testes:\n`);
        untested.forEach(file => console.log(`   - ${file}`));
        
        // Gera testes para arquivos sem cobertura
        console.log('\n🤖 Gerando testes para arquivos sem cobertura...\n');
        for (const file of untested.slice(0, 5)) { // Limita a 5 por vez
          await this.processChangedFile(file);
        }
      } else {
        console.log('✅ Todos os arquivos possuem testes!');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar cobertura:', error);
    }
  }

  async getTestFiles(): Promise<string[]> {
    const testsDir = path.join(__dirname, '../tests');
    const files: string[] = [];

    const walk = async (dir: string) => {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await walk(fullPath);
        } else if (item.endsWith('.spec.ts')) {
          files.push(fullPath);
        }
      }
    };

    await walk(testsDir);
    return files;
  }

  async getSourceFiles(): Promise<string[]> {
    try {
      const output = execSync('git ls-files', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
      });

      return output
        .split('\n')
        .filter(file => file.trim() !== '')
        .filter(file => {
          return (
            (file.includes('frontend/src/components/') ||
             file.includes('frontend/src/app/') ||
             file.includes('backend/controllers/') ||
             file.includes('backend/routes/')) &&
            (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) &&
            !file.includes('.test.') &&
            !file.includes('.spec.')
          );
        });
    } catch (error) {
      console.error('Erro ao obter arquivos de código:', error);
      return [];
    }
  }

  findUntestedFiles(sourceFiles: string[], testFiles: string[]): string[] {
    const tested = new Set<string>();

    testFiles.forEach(testFile => {
      const content = fs.readFileSync(testFile, 'utf-8');
      
      // Procura imports de componentes/páginas
      const imports = content.match(/from ['"](.+)['"]/g) || [];
      imports.forEach(imp => {
        const match = imp.match(/from ['"](..\/)+(.+)['"]/);
        if (match) {
          tested.add(match[2]);
        }
      });
    });

    return sourceFiles.filter(file => {
      const fileName = path.basename(file, path.extname(file));
      const relativePath = file.replace(/^(frontend\/src\/|backend\/)/, '');
      
      return !Array.from(tested).some(t => t.includes(fileName) || t.includes(relativePath));
    });
  }
}

// Execução do script
async function main() {
  const agent = new TestUpdateAgent();

  const command = process.argv[2];

  if (!command) {
    console.log('❌ Comando não especificado\n');
    console.log('Uso:');
    console.log('  npm run test:ai-update watch    - Atualiza testes baseado em mudanças');
    console.log('  npm run test:ai-update coverage - Verifica cobertura de testes');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'watch':
        await agent.watchAndUpdate();
        break;
      case 'coverage':
        await agent.verifyTestCoverage();
        break;
      default:
        console.log(`❌ Comando desconhecido: ${command}\n`);
        console.log('Comandos disponíveis:');
        console.log('  watch    - Atualiza testes baseado em mudanças');
        console.log('  coverage - Verifica cobertura de testes');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro ao executar comando:', error);
    process.exit(1);
  }
}

export { TestUpdateAgent };

if (require.main === module) {
  main().catch(console.error);
}
