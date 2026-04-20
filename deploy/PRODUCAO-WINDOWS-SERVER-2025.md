# Producao 100% - Windows Server 2025 (com WSL2)

Para manter a stack atual (Docker Linux + Nginx + Certbot), este fluxo roda a aplicacao dentro do WSL Ubuntu 22.04 hospedado no Windows Server 2025.

## Premissas

- EC2 com Windows Server 2025
- Voce vai subir os arquivos manualmente para o servidor
- Dominio apontado para o IP publico da instancia

## Onde colocar o projeto no Windows

Exemplo recomendado:

- `C:\Site\site-de-vendas`

## Ordem de execucao (PowerShell como Administrador)

### 1) Preparar host Windows e firewall

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\deploy\windows\01-setup-windows-host.ps1 -Domain "seu-dominio.com.br"
```

Se solicitado, reinicie o servidor.

### 2) Instalar WSL + Ubuntu 22.04

```powershell
.\deploy\windows\02-install-wsl-ubuntu.ps1 -Distro "Ubuntu-22.04"
```

Se solicitar reboot, reinicie e rode novamente para validar.

### 3) Configurar backend/.env de producao

Garanta no arquivo `backend/.env`:

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

### 4) Rodar deploy completo no WSL

```powershell
.\deploy\windows\03-run-deploy-in-wsl.ps1 `
  -Domain "seu-dominio.com.br" `
  -LetsencryptEmail "seu-email@dominio.com" `
  -DbPassword "SENHA_FORTE_AQUI" `
  -DbName "point55" `
  -DbUser "point55_app" `
  -ProjectPathWindows "C:\Site\site-de-vendas" `
  -Distro "Ubuntu-22.04"
```

### 5) (Opcional) Renovacao SSL via Agendador do Windows

A renovacao ja fica no cron Linux dentro do WSL, mas se quiser redundancia no host Windows:

```powershell
.\deploy\windows\04-create-renew-task.ps1 `
  -ProjectPathWindows "C:\Site\site-de-vendas" `
  -Distro "Ubuntu-22.04" `
  -RunAt "03:00"
```

## Validacoes finais

```powershell
curl.exe -I http://seu-dominio.com.br
curl.exe -I https://seu-dominio.com.br
curl.exe -I https://seu-dominio.com.br/api/health
curl.exe -I https://seu-dominio.com.br/api/health/database
```

## Checklist AWS obrigatorio

- Security Group inbound: TCP `22`, `80`, `443`
- Associar Elastic IP na instancia
- DNS A para dominio raiz e `www` apontando para o IP publico

## Observacoes importantes

- Este desenho usa Windows Server apenas como host e executa a stack Linux no WSL2
- Isso evita reescrever toda a stack para Windows nativo
- Em ambiente de producao critica, Linux nativo tende a ser mais estavel e simples para Docker Linux
