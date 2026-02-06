@echo off
echo ========================================
echo VALIDACAO FINAL - FILTROS DE PRODUTOS
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/5] Verificando produtos no banco...
node verificar-preco-zero.js
echo.

echo [2/5] Testando API de categorias...
node -e "const axios = require('axios'); axios.get('http://localhost:5000/api/categorias').then(r => { console.log('Categorias:', r.data.count); r.data.data.forEach(c => console.log(`  - ${c.nome}: ${c.produtos_count} produtos`)); }).catch(e => console.log('Erro:', e.message));"
echo.

echo [3/5] Testando API de produtos (primeiros 20)...
node -e "const axios = require('axios'); axios.get('http://localhost:5000/api/produtos?limite=20').then(r => { console.log(`Total: ${r.data.total} produtos`); console.log(`Retornados: ${r.data.count} produtos`); console.log(`Pagina: ${r.data.pagina} de ${r.data.totalPaginas}`); }).catch(e => console.log('Erro:', e.message));"
echo.

echo [4/5] Testando filtro por categoria (Camisas)...
node -e "const axios = require('axios'); axios.get('http://localhost:5000/api/produtos?categoria=3&limite=10').then(r => { console.log(`Camisas: ${r.data.total} produtos`); }).catch(e => console.log('Erro:', e.message));"
echo.

echo [5/5] Testando busca (NIKE)...
node -e "const axios = require('axios'); axios.get('http://localhost:5000/api/produtos?busca=NIKE').then(r => { console.log(`Busca 'NIKE': ${r.data.total} produtos`); }).catch(e => console.log('Erro:', e.message));"
echo.

echo ========================================
echo VALIDACAO CONCLUIDA!
echo ========================================
echo.
echo Proximo passo:
echo 1. Reinicie o servidor backend (Ctrl+C no terminal do backend e execute novamente)
echo 2. Reinicie o servidor frontend (Ctrl+C no terminal do frontend e execute npm run dev)
echo 3. Acesse http://localhost:3000/produtos
echo.

pause
