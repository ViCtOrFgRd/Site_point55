# Producao 100% - Windows Server 2025 (nativo)

Este fluxo roda tudo nativamente no Windows Server: Node.js (backend/frontend), PostgreSQL local e proxy HTTPS com Caddy.

## Premissas

- EC2 com Windows Server 2025
- Voce vai subir os arquivos manualmente para o servidor
- Dominio apontado para o IP publico da instancia

## Onde colocar o projeto no Windows

Exemplo recomendado:

- `C:\Site\site-de-vendas`

## Ordem de execucao (PowerShell como Administrador)

### 1) Preparar host Windows e dependencias

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\deploy\windows\01-setup-windows-host.ps1 -Domain "seu-dominio.com.br"
```

Esse passo instala: `nodejs-lts`, `postgresql16`, `nssm` e `caddy`.

### 2) Preparar PostgreSQL da aplicacao

```powershell
.\deploy\windows\02-setup-postgres.ps1 -DbPassword "SENHA_FORTE_AQUI" -DbName "point55" -DbUser "point55_app"
```

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

### 4) Inicializar schema e migracoes

```powershell
.\deploy\windows\03-init-db.ps1 `
  -ProjectPath "C:\Site\site-de-vendas" `
  -DbHost "localhost" `
  -DbPort "5432" `
  -DbName "point55" `
  -DbUser "point55_app" `
  -DbPassword "SENHA_FORTE_AQUI"
```

### 5) Publicar backend/frontend como servicos

```powershell
.\deploy\windows\04-deploy-services.ps1 -ProjectPath "C:\Site\site-de-vendas"
```

### 6) Configurar HTTPS e proxy reverso com Caddy

```powershell
.\deploy\windows\05-configure-https-caddy.ps1 `
  -Domain "seu-dominio.com.br" `
  -AcmeEmail "seu-email@dominio.com"
```

### 7) (Opcional) Reiniciar servicos apos alteracoes

```powershell
Restart-Service Point55Backend
Restart-Service Point55Frontend
Restart-Service Point55Caddy
```

## Validacoes finais

```powershell
curl.exe -I http://seu-dominio.com.br
curl.exe -I https://seu-dominio.com.br
curl.exe -I https://seu-dominio.com.br/api/health
curl.exe -I https://seu-dominio.com.br/api/health/database
Get-Service Point55Backend,Point55Frontend,Point55Caddy
```

## Checklist AWS obrigatorio

- Security Group inbound: TCP `22`, `80`, `443`
- Associar Elastic IP na instancia
- DNS A para dominio raiz e `www` apontando para o IP publico

## Observacoes importantes

- SSL e renovacao ficam automaticos no Caddy
- Nao depende de WSL, Docker Linux, Nginx ou Certbot
- Se mudar dominio, rode novamente o script de configuracao do Caddy
