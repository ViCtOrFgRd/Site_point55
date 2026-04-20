const cron = require('node-cron');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const toBool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getBackupConfig = () => {
  const format = (process.env.DB_BACKUP_FORMAT || 'custom').toLowerCase();
  return {
    enabled: toBool(process.env.DB_BACKUP_ENABLED, false),
    runOnStart: toBool(process.env.DB_BACKUP_RUN_ON_START, false),
    cron: process.env.DB_BACKUP_CRON || '0 3 * * *',
    backupDir: path.resolve(__dirname, '..', process.env.DB_BACKUP_DIR || './backups/postgres'),
    retentionDays: toPositiveInt(process.env.DB_BACKUP_RETENTION_DAYS, 14),
    format: format === 'plain' ? 'plain' : 'custom',
    timeoutMs: toPositiveInt(process.env.DB_BACKUP_TIMEOUT_MS, 120000),
    pgDumpPath: process.env.DB_PGDUMP_PATH || 'pg_dump',
    pgRestorePath: process.env.DB_PGRESTORE_PATH || 'pg_restore',
    psqlPath: process.env.DB_PSQL_PATH || 'psql',
  };
};

const timestampForFile = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}${second}`;
};

const runCommand = ({ command, args, env, timeoutMs }) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      shell: false,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`Tempo limite excedido ao executar ${command}`));
        return;
      }
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || `Comando ${command} falhou com código ${code}`));
    });
  });
};

const ensureBackupDir = async (backupDir) => {
  await fsp.mkdir(backupDir, { recursive: true });
};

const removeOldBackups = async (backupDir, retentionDays) => {
  const files = await fsp.readdir(backupDir, { withFileTypes: true });
  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    const fullPath = path.join(backupDir, file.name);
    const stats = await fsp.stat(fullPath);
    const ageMs = now - stats.mtimeMs;

    if (ageMs > maxAgeMs) {
      await fsp.unlink(fullPath);
      removed += 1;
    }
  }

  return removed;
};

const verifyBackupFile = async (backupPath, config) => {
  const stats = await fsp.stat(backupPath);
  if (stats.size <= 0) {
    throw new Error('Arquivo de backup vazio');
  }

  if (config.format === 'custom') {
    await runCommand({
      command: config.pgRestorePath,
      args: ['--list', backupPath],
      env: process.env,
      timeoutMs: config.timeoutMs,
    });
  }
};

const createDatabaseBackup = async (reason = 'manual') => {
  const config = getBackupConfig();

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'point55';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '';

  await ensureBackupDir(config.backupDir);

  const extension = config.format === 'custom' ? 'dump' : 'sql';
  const backupFileName = `${dbName}_${timestampForFile()}.${extension}`;
  const backupPath = path.join(config.backupDir, backupFileName);

  const args = [
    '-h', dbHost,
    '-p', String(dbPort),
    '-U', dbUser,
    '-d', dbName,
    '--no-owner',
    '--no-privileges',
    '-f', backupPath,
  ];

  if (config.format === 'custom') {
    args.push('-F', 'c', '-Z', '9');
  } else {
    args.push('-F', 'p');
  }

  const env = {
    ...process.env,
    PGPASSWORD: dbPassword,
  };

  const startedAt = Date.now();

  await runCommand({
    command: config.pgDumpPath,
    args,
    env,
    timeoutMs: config.timeoutMs,
  });

  await verifyBackupFile(backupPath, config);
  const removedCount = await removeOldBackups(config.backupDir, config.retentionDays);
  const stats = await fsp.stat(backupPath);

  const result = {
    path: backupPath,
    fileName: backupFileName,
    sizeBytes: stats.size,
    durationMs: Date.now() - startedAt,
    removedCount,
    reason,
    createdAt: new Date().toISOString(),
    format: config.format,
  };

  return result;
};

const restoreDatabaseFromFile = async (filePath, options = {}) => {
  const config = getBackupConfig();

  if (!filePath) {
    throw new Error('Arquivo de backup não informado');
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo não encontrado: ${absolutePath}`);
  }

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'point55';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '';

  const env = {
    ...process.env,
    PGPASSWORD: dbPassword,
  };

  const isSql = absolutePath.toLowerCase().endsWith('.sql');

  const command = isSql ? config.psqlPath : config.pgRestorePath;
  const args = isSql
    ? ['-h', dbHost, '-p', String(dbPort), '-U', dbUser, '-d', dbName, '-f', absolutePath]
    : [
      '-h', dbHost,
      '-p', String(dbPort),
      '-U', dbUser,
      '-d', dbName,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      absolutePath,
    ];

  const startedAt = Date.now();
  await runCommand({
    command,
    args,
    env,
    timeoutMs: options.timeoutMs || config.timeoutMs,
  });

  return {
    restoredFrom: absolutePath,
    durationMs: Date.now() - startedAt,
    restoredAt: new Date().toISOString(),
  };
};

const startBackupScheduler = () => {
  const config = getBackupConfig();

  if (!config.enabled) {
    console.info('⏭️ Backup automático do banco desativado (DB_BACKUP_ENABLED=false).');
    return;
  }

  if (!cron.validate(config.cron)) {
    console.error(`❌ Expressão cron inválida para backup: ${config.cron}`);
    return;
  }

  cron.schedule(config.cron, async () => {
    try {
      const result = await createDatabaseBackup('scheduled');
      console.info(`💾 Backup automático concluído: ${result.fileName} (${result.sizeBytes} bytes)`);
    } catch (error) {
      console.error('❌ Falha no backup automático do banco:', error.message);
    }
  });

  console.info(`⏱️ Scheduler de backup do banco configurado: ${config.cron}`);

  if (config.runOnStart) {
    createDatabaseBackup('startup')
      .then((result) => {
        console.info(`💾 Backup de inicialização concluído: ${result.fileName} (${result.sizeBytes} bytes)`);
      })
      .catch((error) => {
        console.error('❌ Falha no backup de inicialização:', error.message);
      });
  }
};

module.exports = {
  getBackupConfig,
  createDatabaseBackup,
  restoreDatabaseFromFile,
  startBackupScheduler,
};
