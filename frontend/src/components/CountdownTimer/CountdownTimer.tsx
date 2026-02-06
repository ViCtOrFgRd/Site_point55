'use client';

import { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.scss';

interface CountdownTimerProps {
  endDate: Date | string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const targetDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

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
