'use client';

import { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.scss';

interface CountdownTimerProps {
  endDate: Date | string;
  onExpire?: () => void;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const calcularTempoRestante = (endDate: Date | string) => {
  const agora = new Date().getTime();
  const dataAlvo = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const distancia = dataAlvo.getTime() - agora;

  if (Number.isNaN(dataAlvo.getTime()) || distancia <= 0) {
    return null;
  }

  const hours = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distancia % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
};

export default function CountdownTimer({ endDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calcularTempoRestante(endDate));

  useEffect(() => {
    let expiredNotified = false;

    const atualizar = () => {
      const restante = calcularTempoRestante(endDate);

      if (!restante) {
        if (!expiredNotified) {
          expiredNotified = true;
          onExpire?.();
        }
        setTimeLeft(null);
        return false;
      }

      setTimeLeft(restante);
      return true;
    };

    if (!atualizar()) {
      return () => undefined;
    }

    const timer = setInterval(() => {
      if (!atualizar()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div className={styles.countdown}>
      <span className={styles.label}>Termina em:</span>
      <div className={styles.time}>
        <div className={styles.timeUnit}>
          <span className={styles.value}>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className={styles.unit}>h</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.timeUnit}>
          <span className={styles.value}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className={styles.unit}>m</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.timeUnit}>
          <span className={styles.value}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className={styles.unit}>s</span>
        </div>
      </div>
    </div>
  );
}
