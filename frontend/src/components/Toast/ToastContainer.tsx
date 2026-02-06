'use client';

import Toast, { ToastProps } from './Toast';
import styles from './ToastContainer.module.scss';

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;
