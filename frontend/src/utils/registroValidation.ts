import { z } from 'zod';

export const NOME_MAX = 255;
export const EMAIL_MAX = 255;
export const CPF_MAX = 14;
export const TELEFONE_MAX = 20;
export const SENHA_MIN = 6;
export const SENHA_MAX = 255;

export const CPF_PATTERN = '[0-9.\\-\\s]+';
export const TELEFONE_PATTERN = '[0-9+()\\-\\s]+';

const cpfRegex = /^[0-9.\-\s]+$/;
const telefoneRegex = /^[0-9+()\-\s]+$/;

export const normalizeCpf = (value?: string) => String(value || '').replace(/\D/g, '');

export const isValidCpf = (value?: string) => {
  const cpfDigits = normalizeCpf(value);
  if (cpfDigits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfDigits)) return false;

  const calcDigito = (base: string, fatorInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) {
      soma += parseInt(base[i], 10) * (fatorInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcDigito(cpfDigits.slice(0, 9), 10);
  const digito2 = calcDigito(cpfDigits.slice(0, 10), 11);

  return digito1 === parseInt(cpfDigits[9], 10) && digito2 === parseInt(cpfDigits[10], 10);
};

const isDataValida = (value: string) => {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
};

export const registrationRequestSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(NOME_MAX, `Nome deve ter no máximo ${NOME_MAX} caracteres`),
  email: z
    .string()
    .trim()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(EMAIL_MAX, `E-mail deve ter no máximo ${EMAIL_MAX} caracteres`),
  senha: z
    .string()
    .min(SENHA_MIN, `Senha deve ter no mínimo ${SENHA_MIN} caracteres`)
    .max(SENHA_MAX, `Senha deve ter no máximo ${SENHA_MAX} caracteres`),
  telefone: z
    .string()
    .trim()
    .min(1, 'Telefone é obrigatório')
    .max(TELEFONE_MAX, `Telefone deve ter no máximo ${TELEFONE_MAX} caracteres`)
    .regex(telefoneRegex, 'Telefone com caracteres inválidos')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 11;
    }, 'Telefone deve ter 10 ou 11 números'),
  cpf: z
    .string()
    .trim()
    .min(1, 'CPF é obrigatório')
    .max(CPF_MAX, `CPF deve ter no máximo ${CPF_MAX} caracteres`)
    .regex(cpfRegex, 'CPF com caracteres inválidos')
    .refine((value) => normalizeCpf(value).length === 11, 'CPF deve ter 11 números')
    .refine((value) => isValidCpf(value), 'CPF inválido'),
  data_nascimento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine(isDataValida, 'Data de nascimento inválida'),
});

export const registrationFormSchema = registrationRequestSchema
  .extend({
    confirmPassword: z
      .string()
      .min(SENHA_MIN, `Confirmação de senha deve ter no mínimo ${SENHA_MIN} caracteres`)
      .max(SENHA_MAX, `Confirmação de senha deve ter no máximo ${SENHA_MAX} caracteres`),
  })
  .refine((data) => data.senha === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  });

export const getValidationMessage = (error: z.ZodError) => {
  return error.issues[0]?.message || 'Dados inválidos';
};
