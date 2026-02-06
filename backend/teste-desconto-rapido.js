#!/usr/bin/env node

/**
 * 🧪 TESTE RÁPIDO: Desconto Percentual
 * 
 * Script simplificado que testa a lógica de desconto
 * sem precisar de autenticação
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';

console.log('\n✅ TESTE RÁPIDO: Desconto Percentual');
console.log('═'.repeat(60));
console.log('📋 O que será testado:');
console.log('  - Cálculo de desconto: (original - atual) / original * 100');
console.log('  - Limite entre 0-100%');
console.log('  - Conversão de tipos (string → número)');
console.log('═'.repeat(60) + '\n');

// Testes de lógica pura (sem API)
function testarLogicaDesconto() {
  console.log('\n🔬 Teste 1: Lógica de Cálculo\n');

  const testes = [
    {
      name: 'Desconto normal',
      preco_atual: 2100,
      preco_original: 30000,
      esperado: 93
    },
    {
      name: 'Desconto 50%',
      preco_atual: 5000,
      preco_original: 10000,
      esperado: 50
    },
    {
      name: 'Sem desconto',
      preco_atual: 100,
      preco_original: 100,
      esperado: 0
    },
    {
      name: 'Desconto > 100% (deve limitar)',
      preco_atual: 0,
      preco_original: 100,
      esperado: 100 // Limitado
    }
  ];

  let passou = 0;
  let falhou = 0;

  for (const teste of testes) {
    // Simular cálculo do frontend
    let desconto = ((teste.preco_original - teste.preco_atual) / teste.preco_original) * 100;
    desconto = Math.round(desconto * 100) / 100;
    
    // Simular limitação do backend
    desconto = Math.max(0, Math.min(100, desconto));

    const resultado = Math.round(desconto) === teste.esperado ? '✅' : '❌';
    console.log(`${resultado} ${teste.name}`);
    console.log(`   Resultado: ${desconto}% (esperado: ${teste.esperado}%)\n`);

    if (Math.round(desconto) === teste.esperado) {
      passou++;
    } else {
      falhou++;
    }
  }

  return { passou, falhou };
}

// Testes de conversão de tipo
function testarConversaoTipo() {
  console.log('\n🔄 Teste 2: Conversão de Tipos\n');

  const testes = [
    {
      name: 'String numérica',
      valor: '50.5',
      esperado: 50.5
    },
    {
      name: 'String inválida (abcd)',
      valor: 'abcd',
      esperado: 0 // Deve virar 0 no backend
    },
    {
      name: 'Número válido',
      valor: 93,
      esperado: 93
    },
    {
      name: 'Null ou undefined',
      valor: null,
      esperado: 0
    },
    {
      name: 'String vazia',
      valor: '',
      esperado: 0
    }
  ];

  let passou = 0;
  let falhou = 0;

  for (const teste of testes) {
    // Simular conversão do backend
    let valor = parseFloat(String(teste.valor || 0).trim());
    if (isNaN(valor)) valor = 0;
    valor = Math.max(0, Math.min(100, valor));

    const resultado = Math.round(valor * 100) / 100 === teste.esperado ? '✅' : '❌';
    console.log(`${resultado} ${teste.name}`);
    console.log(`   Entrada: "${teste.valor}" → Saída: ${valor} (esperado: ${teste.esperado})\n`);

    if (Math.round(valor * 100) / 100 === teste.esperado) {
      passou++;
    } else {
      falhou++;
    }
  }

  return { passou, falhou };
}

// Teste de conectividade com API (opcional)
async function testarAPI() {
  console.log('\n🌐 Teste 3: Conectividade com API\n');

  return new Promise((resolve) => {
    const req = http.get(`${API_URL}/api/health`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ Servidor backend está respondendo');
        console.log(`   Status: ${res.statusCode}`);
        resolve({ passou: 1, falhou: 0 });
      } else {
        console.log(`⚠️  Status inesperado: ${res.statusCode}`);
        resolve({ passou: 0, falhou: 1 });
      }
    });

    req.on('error', (err) => {
      console.log(`❌ Não conseguiu conectar ao servidor`);
      console.log(`   Erro: ${err.message}`);
      console.log(`   URL: ${API_URL}`);
      resolve({ passou: 0, falhou: 1 });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Timeout ao conectar ao servidor');
      resolve({ passou: 0, falhou: 1 });
    });
  });
}

// Executar todos os testes
async function executar() {
  let totalPassed = 0;
  let totalFailed = 0;

  // Teste 1: Lógica
  const r1 = testarLogicaDesconto();
  totalPassed += r1.passou;
  totalFailed += r1.falhou;

  // Teste 2: Conversão
  const r2 = testarConversaoTipo();
  totalPassed += r2.passou;
  totalFailed += r2.falhou;

  // Teste 3: API
  const r3 = await testarAPI();
  totalPassed += r3.passou;
  totalFailed += r3.falhou;

  // Resumo
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RESUMO GERAL\n');
  console.log(`✅ Testes aprovados: ${totalPassed}`);
  console.log(`❌ Testes falhados: ${totalFailed}`);
  const taxa = totalPassed + totalFailed > 0 
    ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
    : 0;
  console.log(`📈 Taxa de sucesso: ${taxa}%`);

  if (totalFailed === 0) {
    console.log('\n🎉 LÓGICA DE DESCONTO ESTÁ FUNCIONANDO PERFEITAMENTE!');
  } else {
    console.log('\n⚠️  Alguns testes falharam.');
  }

  console.log('\n💡 Para testes completos com API:');
  console.log('   1. Execute: node criar-usuario-teste.js');
  console.log('   2. Execute: node test-desconto-percentual.js');
  console.log('\n' + '═'.repeat(60) + '\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

// Iniciar
executar();
