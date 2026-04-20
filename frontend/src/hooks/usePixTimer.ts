/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';

interface UsePixTimerOptions {
  expirationMinutes?: number;
  createdAt?: string | Date;
  expiresAt?: string | Date;
  onExpire?: () => void;
}

interface PixTimerResult {
  timeRemaining: number; // em segundos
  isExpired: boolean;
  formattedTime: string; // "MM:SS"
  percentRemaining: number; // 0-100
}

/**
 * Hook para gerenciar timer de expiração do PIX
 * Por padrão, PIX expira em 15 minutos
 */
export function usePixTimer({
  expirationMinutes = 5,
  createdAt,
  expiresAt,
  onExpire,
}: UsePixTimerOptions = {}): PixTimerResult {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(expirationMinutes * 60);
  const [initialized, setInitialized] = useState<boolean>(false);
  const expireNotifiedRef = useRef<boolean>(false);

  const resolveDate = (value?: string | Date, endOfDay?: boolean) => {
    if (!value) return null;
    if (value instanceof Date) return value;

    const raw = String(value).trim();
    
    // Se é apenas data YYYY-MM-DD (sem hora)
    const dateOnlyMatch = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (dateOnlyMatch) {
      const [, dateStr] = dateOnlyMatch;
      const base = new Date(`${dateStr}T00:00:00`); // Parse como local time
      
      if (endOfDay) {
        // Setar para 23:59:59 do mesmo dia em local time
        base.setHours(23, 59, 59, 999);
      }
      return base;
    }

    // Fallback: tentar parsear como está
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  useEffect(() => {
    const now = new Date();
    const createdDate = resolveDate(createdAt) || now;
    const expirationDate =
      resolveDate(expiresAt, true) || new Date(createdDate.getTime() + expirationMinutes * 60 * 1000);

    const remaining = Math.max(0, Math.floor((expirationDate.getTime() - now.getTime()) / 1000));
    const total = Math.max(1, Math.floor((expirationDate.getTime() - createdDate.getTime()) / 1000));

    setTimeRemaining(remaining);
    setTotalSeconds(total);
    setInitialized(true);
    expireNotifiedRef.current = false;

    if (remaining === 0) {
      setIsExpired(true);
      if (!expireNotifiedRef.current) {
        onExpire?.();
        expireNotifiedRef.current = true;
      }
    } else {
      setIsExpired(false);
    }
  }, [createdAt, expiresAt, expirationMinutes]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (timeRemaining <= 0) {
      setIsExpired(true);
      if (!expireNotifiedRef.current) {
        onExpire?.();
        expireNotifiedRef.current = true;
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          setIsExpired(true);
          if (!expireNotifiedRef.current) {
            onExpire?.();
            expireNotifiedRef.current = true;
          }
          clearInterval(timer);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onExpire, initialized]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentRemaining = Math.max(0, Math.min(100, (timeRemaining / totalSeconds) * 100));

  return {
    timeRemaining,
    isExpired,
    formattedTime: formatTime(timeRemaining),
    percentRemaining,
  };
}
