# Sistema de Backup do Banco (PostgreSQL)

Este projeto possui backup de banco com duas formas:

- Manual via script (`npm run backup:db`)
- Automático via scheduler (`node-cron`) no `server.js`

## Pré-requisitos

- PostgreSQL client tools instalados e no PATH:
  - `pg_dump`
  - `pg_restore`
  - `psql`
- Variáveis de conexão do banco válidas no `.env`

## Configuração no `.env`

```env
DB_BACKUP_ENABLED=false
DB_BACKUP_CRON=0 3 * * *
DB_BACKUP_RUN_ON_START=false
DB_BACKUP_DIR=./backups/postgres
DB_BACKUP_RETENTION_DAYS=14
DB_BACKUP_FORMAT=custom
DB_BACKUP_TIMEOUT_MS=120000
DB_PGDUMP_PATH=pg_dump
DB_PGRESTORE_PATH=pg_restore
DB_PSQL_PATH=psql
```

## Execução Manual

Gerar backup:

```bash
npm run backup:db
```

Restaurar backup:

```bash
npm run restore:db -- --file ./backups/postgres/point55_20260215_030000.dump
```

Também funciona com `.sql`:

```bash
npm run restore:db -- --file ./backups/postgres/point55_20260215_030000.sql
```

## Execução Automática

Para ativar backup automático diário às 03:00:

```env
DB_BACKUP_ENABLED=true
DB_BACKUP_CRON=0 3 * * *
```

Para executar um backup logo na inicialização do backend:

```env
DB_BACKUP_RUN_ON_START=true
```

## Estratégia implementada

- Formato `custom` (`.dump`) por padrão para restauração mais segura
- Suporte a `plain` (`.sql`) se necessário
- Validação básica do arquivo gerado
- Retenção automática por dias (`DB_BACKUP_RETENTION_DAYS`)
- Logs no console para sucesso e falhas

## Recomendações de produção

- Manter `DB_BACKUP_ENABLED=true`
- Fazer cópia dos backups para armazenamento externo (S3, NAS ou servidor remoto)
- Testar restauração pelo menos 1x por mês
- Restringir acesso ao diretório de backup
