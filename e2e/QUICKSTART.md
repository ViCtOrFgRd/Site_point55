# 🚀 Guia de Início Rápido - Testes E2E com IA

## Instalação (5 minutos)

```bash
# 1. Navegar para pasta e2e
cd e2e

# 2. Instalar dependências
npm install

# 3. Instalar navegadores
npm run install-browsers

# 4. Configurar ambiente
cp .env.example .env
# Edite .env e adicione sua OPENAI_API_KEY
```

## Primeiro Teste (2 minutos)

```bash
# Executar testes básicos
npm test auth.spec.ts
```

## Gerar Testes com IA (3 minutos)

```bash
# Gerar testes automaticamente
npm run test:ai-generate
```

## Visualizar Resultados

```bash
# Abrir relatório HTML
npm run report
```


## Próximos Passos

1. **Explore os testes existentes** em `tests/`
2. **Personalize Page Objects** em `tests/helpers/page-objects/`
3. **Configure CI/CD** usando `.github/workflows/e2e-tests.yml`
4. **Use agentes de IA** para análise de falhas

## Comandos Úteis

```bash
# Testes críticos apenas
npm run test:critical

# Modo visual (UI)
npm run test:ui

# Debug
npm run test:debug

# Analisar falhas com IA
npm run test:ai-analyze

# Atualizar testes automaticamente
npm run test:ai-update watch
```

## Ajuda

- 📖 Veja [README.md](README.md) completo
- 🐛 Problemas? Verifique [Troubleshooting](README.md#-troubleshooting)
- 💬 Dúvidas? Abra uma issue

## Arquitetura

```
Usuário -> Playwright -> Browser -> App
                ↓
           Page Objects (abstração)
                ↓
           Assertions (validações)
                ↓
           Relatórios + IA (análise)
```

Pronto para começar! 🎉
