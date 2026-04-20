# HTTPS com Let's Encrypt

Este projeto nao tinha stack de producao versionada. Este guia adiciona um proxy Nginx na frente do frontend e backend e usa Certbot para emitir e renovar o certificado SSL com Let's Encrypt.

## O que foi adicionado

- docker-compose.prod.yml
- backend/Dockerfile
- frontend/Dockerfile
- deploy/nginx/default.conf.template
- deploy/ssl/init-letsencrypt.sh

## Arquitetura

- Nginx recebe trafego em 80/443.
- Certbot valida o dominio via webroot em /.well-known/acme-challenge/.
- Frontend Next.js roda internamente na porta 3000.
- Backend Express roda internamente na porta 5000.
- Nginx encaminha:
  - /api/ para o backend
  - /socket.io/ para o backend
  - /image/ para o backend
  - todo o resto para o frontend

## Pre-requisitos

- Servidor Linux com Docker e Docker Compose.
- Dominio apontando para o IP publico do servidor.
- Portas 80 e 443 liberadas no firewall.
- Arquivo backend/.env configurado para producao.

## Ajustes obrigatorios antes de subir

No backend/.env de producao:

- FRONTEND_URL=https://seu-dominio.com.br
- BACKEND_URL=https://seu-dominio.com.br/api
- API_URL=https://seu-dominio.com.br/api
- API_BASE_URL=https://seu-dominio.com.br
- NODE_ENV=production

No host/ambiente do Docker Compose:

- DOMAIN=seu-dominio.com.br
- LETSENCRYPT_EMAIL=seu-email@dominio.com

## Subida inicial

1. Exporte as variaveis no shell do servidor.

```sh
export DOMAIN=seu-dominio.com.br
export LETSENCRYPT_EMAIL=seu-email@dominio.com
```

2. Suba a stack de aplicacao.

```sh
docker compose -f docker-compose.prod.yml up -d --build backend frontend nginx
```

3. Emita o certificado.

```sh
sh deploy/ssl/init-letsencrypt.sh
```

4. Se a emissao ocorrer com sucesso, valide:

```sh
curl -I http://seu-dominio.com.br
curl -I https://seu-dominio.com.br
curl -I https://seu-dominio.com.br/api/health
```

## Renovacao automatica

O Certbot precisa rodar periodicamente no servidor. Exemplo de cron diario:

```sh
0 3 * * * cd /caminho/do/projeto && docker compose -f docker-compose.prod.yml run --rm certbot renew --webroot --webroot-path /var/www/certbot && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Observacoes importantes

- O certificado nao pode ser emitido daqui no workspace porque a validacao do Let's Encrypt depende de um dominio publico apontando para o servidor de producao.
- O frontend usa NEXT_PUBLIC_API_URL no build do container. Se o dominio mudar, reconstrua o frontend.
- O backend foi ajustado para confiar no proxy reverso, necessario para operar corretamente atras do Nginx/HTTPS.
- Se voce usar subdominio de API separado, o compose e o template do Nginx precisam ser adaptados. Hoje a configuracao assume tudo sob o mesmo dominio, com API em /api.