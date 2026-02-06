'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { FiX, FiLoader } from 'react-icons/fi';
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
    principal?: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function AddressForm({ address, onSubmit, onCancel, isEdit = false }: AddressFormProps) {
  const toast = useToast();
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
    principal: address?.principal || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCepChange = (value: string) => {
    // Remove tudo que não é número
    const apenasNumeros = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const cepLimitado = apenasNumeros.slice(0, 8);
    
    // Formata como 00000-000
    let cepFormatado = cepLimitado;
    if (cepLimitado.length > 5) {
      cepFormatado = `${cepLimitado.slice(0, 5)}-${cepLimitado.slice(5)}`;
    }
    
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
        toast.warning('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));

      toast.success('CEP encontrado!');
    } catch (error) {
      toast.error('Erro ao buscar CEP');
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
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        cep: formData.cep.replace(/\D/g, ''), // Remove formatação
      });
    } catch (error) {
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
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>CEP *</label>
              <div className={styles.cepInput}>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className={errors.cep ? styles.error : ''}
                />
                {buscandoCep && <FiLoader className={styles.spinner} />}
              </div>
              {errors.cep && <span className={styles.errorText}>{errors.cep}</span>}
              <small>Digite o CEP para preenchimento automático</small>
            </div>
          </div>

          <div className={styles.field}>
            <label>Rua *</label>
            <input
              type="text"
              value={formData.rua}
              onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
              placeholder="Nome da rua"
              className={errors.rua ? styles.error : ''}
            />
            {errors.rua && <span className={styles.errorText}>{errors.rua}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Número *</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="123"
                className={errors.numero ? styles.error : ''}
              />
              {errors.numero && <span className={styles.errorText}>{errors.numero}</span>}
            </div>

            <div className={styles.field}>
              <label>Complemento</label>
              <input
                type="text"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                placeholder="Apto, Bloco, etc"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Bairro *</label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Nome do bairro"
              className={errors.bairro ? styles.error : ''}
            />
            {errors.bairro && <span className={styles.errorText}>{errors.bairro}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Cidade *</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Nome da cidade"
                className={errors.cidade ? styles.error : ''}
              />
              {errors.cidade && <span className={styles.errorText}>{errors.cidade}</span>}
            </div>

            <div className={styles.field}>
              <label>Estado *</label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="SP"
                maxLength={2}
                className={errors.estado ? styles.error : ''}
              />
              {errors.estado && <span className={styles.errorText}>{errors.estado}</span>}
            </div>
          </div>

          <div className={styles.checkboxField}>
            <label>
              <input
                type="checkbox"
                checked={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.checked })}
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
