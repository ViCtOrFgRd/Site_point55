const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', 'backups', 'image', '.git']);

function walk(directory, files = []) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) {
        continue;
      }
      walk(fullPath, files);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkSyntax(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  new vm.Script(code, { filename: filePath });
}

function run() {
  const jsFiles = walk(ROOT_DIR);
  const failures = [];

  for (const filePath of jsFiles) {
    try {
      checkSyntax(filePath);
    } catch (error) {
      failures.push({
        filePath,
        message: error && error.message ? error.message.split('\n')[0] : 'Erro de sintaxe desconhecido',
      });
    }
  }

  console.log(`🔎 Arquivos JS analisados: ${jsFiles.length}`);

  if (failures.length > 0) {
    console.error(`❌ Falhas de sintaxe: ${failures.length}`);
    for (const failure of failures) {
      const relativePath = path.relative(ROOT_DIR, failure.filePath);
      console.error(` - ${relativePath}: ${failure.message}`);
    }
    process.exit(1);
  }

  console.log('✅ Smoke test concluído: sem erros de sintaxe.');
}

run();
