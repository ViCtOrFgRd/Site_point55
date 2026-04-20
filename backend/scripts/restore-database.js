require('dotenv').config();

const { restoreDatabaseFromFile } = require('../services/databaseBackupService');

const parseArgs = () => {
  const args = process.argv.slice(2);
  let filePath = '';

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--file' || arg === '-f') {
      filePath = args[i + 1] || '';
      i += 1;
    }
  }

  return { filePath };
};

const main = async () => {
  const { filePath } = parseArgs();

  if (!filePath) {
    console.error('❌ Informe o arquivo com --file <caminho-do-backup>');
    process.exit(1);
  }

  try {
    const result = await restoreDatabaseFromFile(filePath);
    console.log('✅ Restauração concluída com sucesso');
    console.log(`📁 Origem: ${result.restoredFrom}`);
    console.log(`⏱️ Duração: ${result.durationMs} ms`);
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error.message);
    process.exit(1);
  }
};

main();
