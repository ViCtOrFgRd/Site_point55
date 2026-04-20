/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { useNotification } from '@/hooks/useNotification';
import styles from './AddressForm.module.scss';

interface AddressFormProps {
  address?: {
    id?: number;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    is_principal?: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function AddressForm({ address, onSubmit, onCancel, isEdit = false }: AddressFormProps) {
  const { success, error, warning } = useNotification();
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  
  const [formData, setFormData] = useState({
    rua: address?.rua || '',
    numero: address?.numero || '',
    complemento: address?.complemento || '',
    bairro: address?.bairro || '',
    cidade: address?.cidade || '',
    estado: address?.estado || '',
    cep: address?.cep || '',
    is_principal: address?.is_principal || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const RUA_MAX = 255;
  const NUMERO_MAX = 10;
  const COMPLEMENTO_MAX = 100;
  const BAIRRO_MAX = 100;
  const CIDADE_MAX = 100;

  const handleCepChange = (value: string) => {
    const cepFormatado = String(value);
    const apenasNumeros = cepFormatado.replace(/\D/g, '').slice(0, 8);

    setFormData(prev => ({ ...prev, cep: cepFormatado }));
    
    // Busca automática quando completar 8 dígitos
    if (apenasNumeros.length === 8) {
      buscarCep(apenasNumeros);
    }
  };

  const buscarCep = async (cep: string) => {
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        warning('CEP não encontrado', 'Verifique o CEP digitado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));

      success('CEP encontrado!', 'Endereço preenchido automaticamente');
    } catch (err) {
      error('Erro ao buscar CEP', 'Verifique sua conexão');
    } finally {
      setBuscandoCep(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cep || formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP inválido';
    }
    if (!formData.rua.trim()) {
      newErrors.rua = 'Rua é obrigatória';
    }
    if (!formData.numero.trim()) {
      newErrors.numero = 'Número é obrigatório';
    }
    if (!formData.bairro.trim()) {
      newErrors.bairro = 'Bairro é obrigatório';
    }
    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }
    if (!formData.estado.trim() || formData.estado.length !== 2) {
      newErrors.estado = 'Estado inválido (ex: SP)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      warning('Validação', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        cep: formData.cep.replace(/\D/g, ''), // Remove formatação
      });
    } catch (err) {
      // Erro já tratado no componente pai
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{isEdit ? 'Editar Endereço' : 'Novo Endereço'}</h2>
          <button onClick={onCancel} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>CEP (8 dígitos) *</label>
              <div className={styles.cepInput}>
                <IMaskInput
                  mask="00000-000"
                  value={formData.cep}
                  onAccept={(value) => handleCepChange(String(value))}
                  placeholder="00000-000"
                  maxLength={9}
                  inputMode="numeric"
                  className={errors.cep ? styles.error : ''}
                />
                {buscandoCep && <Loader className={styles.spinner} />}
              </div>
              {errors.cep && <span className={styles.errorText}>{errors.cep}</span>}
              <small>Digite o CEP para preenchimento automático</small>
            </div>
          </div>

          <div className={styles.field}>
            <label>Rua (máx. 255 caracteres) *</label>
            <input
              type="text"
              value={formData.rua}
              onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
              placeholder="Nome da rua"
              maxLength={RUA_MAX}
              className={errors.rua ? styles.error : ''}
            />
            {errors.rua && <span className={styles.errorText}>{errors.rua}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Número (máx. 10 caracteres) *</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="123"
                maxLength={NUMERO_MAX}
                className={errors.numero ? styles.error : ''}
              />
              {errors.numero && <span className={styles.errorText}>{errors.numero}</span>}
            </div>

            <div className={styles.field}>
              <label>Complemento (máx. 100 caracteres)</label>
              <input
                type="text"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                placeholder="Apto, Bloco, etc"
                maxLength={COMPLEMENTO_MAX}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Bairro (máx. 100 caracteres) *</label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Nome do bairro"
              maxLength={BAIRRO_MAX}
              className={errors.bairro ? styles.error : ''}
            />
            {errors.bairro && <span className={styles.errorText}>{errors.bairro}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Cidade (máx. 100 caracteres) *</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Nome da cidade"
                maxLength={CIDADE_MAX}
                className={errors.cidade ? styles.error : ''}
              />
              {errors.cidade && <span className={styles.errorText}>{errors.cidade}</span>}
            </div>

            <div className={styles.field}>
              <label>Estado (UF com 2 letras) *</label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="SP"
                maxLength={2}
                pattern="[A-Za-z]{2}"
                title="Informe a UF com 2 letras, exemplo: SP"
                className={errors.estado ? styles.error : ''}
              />
              {errors.estado && <span className={styles.errorText}>{errors.estado}</span>}
            </div>
          </div>

          <div className={styles.checkboxField}>
            <label>
              <input
                type="checkbox"
                checked={formData.is_principal}
                onChange={(e) => setFormData({ ...formData, is_principal: e.target.checked })}
              />
              <span>Definir como endereço principal</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading || buscandoCep}>
              {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
