require('dotenv').config();

const { createDatabaseBackup } = require('../services/databaseBackupService');

const main = async () => {
  try {
    const result = await createDatabaseBackup('manual-cli');
    console.log('✅ Backup concluído com sucesso');
    console.log(`📁 Arquivo: ${result.path}`);
    console.log(`📦 Tamanho: ${result.sizeBytes} bytes`);
    console.log(`⏱️ Duração: ${result.durationMs} ms`);
    console.log(`🧹 Backups removidos por retenção: ${result.removedCount}`);
  } catch (error) {
    console.error('❌ Erro ao gerar backup:', error.message);
    process.exit(1);
  }
};

main();
