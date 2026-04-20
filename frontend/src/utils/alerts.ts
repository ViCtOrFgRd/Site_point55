import Swal, { SweetAlertOptions } from 'sweetalert2';

export const confirmDelete = async (
  title = 'Tem certeza?',
  message = 'Esta ação não pode ser desfeita!'
) => {
  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, deletar!',
    cancelButtonText: 'Cancelar',
  });

  return result.isConfirmed;
};

export const showAlert = async (
  title: string,
  message: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {
  await Swal.fire({
    title,
    text: message,
    icon,
    confirmButtonColor: '#0d6efd',
  });
};

export const showConfirm = async (options: SweetAlertOptions) => {
  const result = await Swal.fire({
    confirmButtonColor: '#0d6efd',
    cancelButtonColor: '#6c757d',
    ...options,
  });

  return result.isConfirmed;
};

export const confirmAction = async (
  title: string,
  message: string,
  confirmText = 'Confirmar'
) => {
  return showConfirm({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
  });
};

export const promptText = async (
  title: string,
  inputLabel: string,
  options?: {
    placeholder?: string;
    confirmText?: string;
    minLength?: number;
    emptyMessage?: string;
    minLengthMessage?: string;
  }
) => {
  const {
    placeholder = '',
    confirmText = 'Confirmar',
    minLength = 0,
    emptyMessage = 'Preencha este campo',
    minLengthMessage = `Digite pelo menos ${minLength} caracteres`,
  } = options || {};

  const result = await Swal.fire({
    title,
    input: 'text',
    inputLabel,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0d6efd',
    cancelButtonColor: '#6c757d',
    inputValidator: (value) => {
      const text = String(value || '').trim();
      if (!text) return emptyMessage;
      if (minLength > 0 && text.length < minLength) return minLengthMessage;
      return null;
    },
  });

  if (!result.isConfirmed) return null;
  return String(result.value || '').trim();
};

export const showSuccess = async (message: string) => {
  await Swal.fire({
    title: 'Sucesso!',
    text: message,
    icon: 'success',
    confirmButtonColor: '#0d6efd',
    timer: 2000,
    timerProgressBar: true,
  });
};

export const showError = async (message: string) => {
  await Swal.fire({
    title: 'Erro!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#0d6efd',
  });
};
