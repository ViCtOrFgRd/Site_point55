-- Script para inserir usuários de teste para E2E
-- Execute este script antes de rodar os testes E2E

-- Deletar usuários de teste existentes
DELETE FROM usuarios WHERE email IN ('victorfiigueiredo@gmail.com', 'teste@example.com');

-- Inserir usuário admin de teste (senha: victor123)
INSERT INTO usuarios (nome, email, senha_hash, cpf, telefone, is_admin, ativo)
VALUES (
  'Victor Figueiredo',
  'victorfiigueiredo@gmail.com',
  '$2b$10$HpiyEWeHEXBkNe/Stdav6uo3uhP.PyW4bCMeHvylVoati1FI.7vk.',
  '99999999999',
  '11999999999',
  true,
  true
);

-- Inserir usuário comum de teste (senha: Teste123!)
INSERT INTO usuarios (nome, email, senha_hash, cpf, telefone, is_admin, ativo)
VALUES (
  'Usuario Teste',
  'teste@example.com',
  '$2b$10$tIQWNPEXhxshkFDLoVUO4uHnZcwfd9MwKQ.qM.KiYvdwRg8R6ttTy',
  '11111111111',
  '11111111111',
  false,
  true
);

-- Verificar usuários criados
SELECT id, nome, email, is_admin, ativo FROM usuarios WHERE email IN ('victorfiigueiredo@gmail.com', 'teste@example.com');
