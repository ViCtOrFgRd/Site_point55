/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef, useState } from 'react';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import { io, Socket } from 'socket.io-client';
import { notificationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { Notificacao } from '@/types';
import styles from './NotificationsBell.module.scss';

const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4);
  }
  if (apiUrl) {
    return apiUrl;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export default function NotificationsBell() {
  const { user } = useAuth();
  const { info } = useNotification();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasUnread = unreadCount > 0;

  const playNotificationSound = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const context = audioContextRef.current;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.21);
    } catch (error) {
      console.warn('Nao foi possivel reproduzir som de notificacao:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.unread();
      if (response?.success) {
        setUnreadCount(Number(response.nao_lidas || 0));
      }
    } catch (error) {
      console.error('Erro ao buscar nao lidas:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.list({ pagina: 1, limite: 20 });
      if (response?.success) {
        setItems(Array.isArray(response.data) ? response.data : []);
        if (typeof response.nao_lidas !== 'undefined') {
          setUnreadCount(Number(response.nao_lidas || 0));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar notificacoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, lida_em: item.lida_em || new Date().toISOString() } : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error('Erro ao marcar lida:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((item) => ({ ...item, lida_em: item.lida_em || now })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      const item = items.find((current) => current.id === id);
      await notificationService.remove(id);
      setItems((prev) => prev.filter((current) => current.id !== id));
      if (item && !item.lida_em) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      console.error('Erro ao remover notificacao:', error);
    }
  };

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    fetchUnreadCount();

    if (socketRef.current) {
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return;
    }

    const socket = io(getSocketUrl(), {
      auth: { token },
    });

    socket.on('notification:new', (notification: Notificacao) => {
      setItems((prev) => {
        if (prev.some((item) => item.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev].slice(0, 50);
      });
      if (!notification.lida_em) {
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();
      }
      info(notification.titulo, notification.mensagem);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button
        className={`${styles.bellButton} ${hasUnread ? styles.bellActive : ''}`}
        onClick={handleToggle}
        title="Notificacoes"
      >
        <FiBell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Notificacoes</span>
            <button className={styles.markAllButton} onClick={handleMarkAllRead}>
              Marcar todas
            </button>
          </div>

          <div className={styles.panelBody}>
            {loading && <p className={styles.empty}>Carregando...</p>}
            {!loading && items.length === 0 && (
              <p className={styles.empty}>Sem notificacoes.</p>
            )}
            {!loading && items.length > 0 && (
              <ul className={styles.list}>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`${styles.item} ${item.lida_em ? styles.read : styles.unread}`}
                  >
                    <div className={styles.itemRow}>
                      <div className={styles.itemText}>
                        <span className={styles.title}>{item.titulo}</span>
                        <span className={styles.dot} aria-hidden="true">•</span>
                        <span className={styles.message}>{item.mensagem}</span>
                      </div>
                      <div className={styles.itemMeta}>
                        <span className={styles.time}>
                          {new Date(item.criada_em).toLocaleString('pt-BR')}
                        </span>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleMarkRead(item.id)}
                          disabled={Boolean(item.lida_em)}
                          title="Marcar como lida"
                        >
                          <FiCheck size={14} />
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleRemove(item.id)}
                          title="Excluir"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
