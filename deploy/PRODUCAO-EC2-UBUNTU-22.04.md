# Producao 100% - EC2 t2.micro Ubuntu 22.04

Este guia usa os scripts em `deploy/prod` para preparar servidor, banco, deploy da stack e SSL.

## Premissas

- EC2: Ubuntu Jammy 22.04 (AMI `ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20230516`)
- Voce vai subir os arquivos manualmente para o servidor
- Dominio ja comprado e com acesso ao painel DNS

## Ordem de execucao

No servidor EC2, dentro da pasta do projeto:

```bash
cd /home/ubuntu/site-de-vendas
chmod +x deploy/prod/*.sh deploy/ssl/init-letsencrypt.sh
```

### 1) Preparar sistema (Docker + firewall)

```bash
sudo APP_USER=ubuntu bash deploy/prod/01-setup-ubuntu.sh
```

Depois rode logout/login para o grupo docker aplicar no usuario `ubuntu`.

### 2) Detectar IP publico e checklist DNS/AWS

```bash
DOMAIN=seu-dominio.com.br bash deploy/prod/02-configure-host.sh
```

Ajustes manuais obrigatorios:

- Security Group inbound: `22`, `80`, `443` TCP
- DNS `A`: `seu-dominio.com.br` e `www.seu-dominio.com.br` apontando para o IP da EC2

### 3) Preparar PostgreSQL no host

```bash
sudo -E DB_NAME=point55 DB_USER=point55_app DB_PASSWORD='SENHA_FORTE_AQUI' bash deploy/prod/03-setup-postgres.sh
```

### 4) Configurar backend/.env de producao

Garanta no `backend/.env`:

- `NODE_ENV=production`
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=point55`
- `DB_USER=point55_app`
- `DB_PASSWORD=SENHA_FORTE_AQUI`
- `FRONTEND_URL=https://seu-dominio.com.br`
- `BACKEND_URL=https://seu-dominio.com.br/api`
- `API_URL=https://seu-dominio.com.br/api`
- `API_BASE_URL=https://seu-dominio.com.br`
- `JWT_SECRET` com no minimo 16 caracteres

### 5) Inicializar schema + migracoes

```bash
DB_HOST=localhost DB_PORT=5432 DB_NAME=point55 DB_USER=point55_app DB_PASSWORD='SENHA_FORTE_AQUI' bash deploy/prod/04-init-db.sh
```

### 6) Subir aplicacao em producao

```bash
DOMAIN=seu-dominio.com.br bash deploy/prod/05-deploy-app.sh
```

### 7) Emitir SSL com Let's Encrypt

```bash
DOMAIN=seu-dominio.com.br LETSENCRYPT_EMAIL=seu-email@dominio.com bash deploy/prod/06-setup-ssl.sh
```

### 8) Configurar renovacao automatica SSL

```bash
bash deploy/prod/07-setup-renew-cron.sh
```

## Validacoes finais

```bash
curl -I http://seu-dominio.com.br
curl -I https://seu-dominio.com.br
curl -I https://seu-dominio.com.br/api/health
curl -I https://seu-dominio.com.br/api/health/database
```

## Observacoes importantes para t2.micro

- t2.micro tem pouca RAM; mantenha apenas servicos necessarios ativos
- Evite processos extras no host
- Se tiver lentidao no build do frontend, rode build em horario de baixo uso
- Considere ativar swap de 1G a 2G no host

## Comandos uteis

Ver logs:

```bash
docker compose -f docker-compose.prod.yml logs -f --tail=200
```

Ver status da stack:

```bash
docker compose -f docker-compose.prod.yml ps
```

Rebuild e restart:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
