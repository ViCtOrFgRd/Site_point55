'use client';

import { FiMapPin, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import styles from './AddressList.module.scss';

interface Address {
  id: number;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  principal: boolean;
}

interface AddressListProps {
  addresses: Address[];
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetPrincipal: (id: number) => void;
}

export default function AddressList({ addresses, onEdit, onDelete, onSetPrincipal }: AddressListProps) {
  const formatCep = (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return cep;
  };

  if (addresses.length === 0) {
    return (
      <div className={styles.empty}>
        <FiMapPin />
        <p>Você ainda não tem endereços cadastrados</p>
        <small>Adicione um endereço para facilitar suas compras</small>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {addresses.map((address) => (
        <div key={address.id} className={`${styles.card} ${address.principal ? styles.principal : ''}`}>
          {address.principal && (
            <div className={styles.badge}>
              <FiStar /> Principal
            </div>
          )}

          <div className={styles.content}>
            <div className={styles.icon}>
              <FiMapPin />
            </div>

            <div className={styles.info}>
              <p className={styles.street}>
                {address.rua}, {address.numero}
                {address.complemento && ` - ${address.complemento}`}
              </p>
              <p className={styles.district}>{address.bairro}</p>
              <p className={styles.city}>
                {address.cidade} - {address.estado}
              </p>
              <p className={styles.cep}>CEP: {formatCep(address.cep)}</p>
            </div>
          </div>

          <div className={styles.actions}>
            {!address.principal && (
              <button
                onClick={() => onSetPrincipal(address.id)}
                className={styles.setPrincipalButton}
                title="Definir como principal"
              >
                <FiStar /> Tornar Principal
              </button>
            )}
            <button
              onClick={() => onEdit(address)}
              className={styles.editButton}
              title="Editar endereço"
            >
              <FiEdit2 />
            </button>
            <button
              onClick={() => onDelete(address.id)}
              className={styles.deleteButton}
              title="Excluir endereço"
              disabled={address.principal}
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
