export const testData = {
  users: {
    valid: {
      nome: 'Teste Usuario',
      email: `teste_${Date.now()}@example.com`,
      cpf: '12345678901',
      telefone: '11999999999',
      senha: 'Teste123!',
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'victorfiigueiredo@gmail.com',
      senha: process.env.TEST_ADMIN_PASSWORD || 'victor123',
    },
    invalid: {
      email: 'email-invalido',
      senha: '123',
    },
  },
  
  produtos: {
    sample: {
      nome: 'Produto Teste',
      descricao: 'Descrição do produto teste',
      preco: 99.90,
      categoria_id: 1,
      estoque: 10,
    },
  },
  
  endereco: {
    valid: {
      cep: '01310-100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'Apto 101',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
    },
  },
  
  cartao: {
    valid: {
      numero: '4111111111111111',
      nome: 'TESTE USUARIO',
      validade: '12/2025',
      cvv: '123',
    },
  },
  
  cupom: {
    valid: 'DESCONTO10',
    expired: 'VENCIDO',
    invalid: 'INVALIDO123',
  },
};

export const generateRandomEmail = () => {
  return `teste_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
};

export const generateRandomCPF = () => {
  const randomDigits = () => Math.floor(Math.random() * 10);
  const cpf = Array.from({ length: 11 }, randomDigits).join('');
  return cpf;
};

export const generateRandomPhone = () => {
  return `119${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
};
