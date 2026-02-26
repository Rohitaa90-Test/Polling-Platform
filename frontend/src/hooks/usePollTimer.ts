import { useState, useEffect, useRef } from 'react';

interface UsePollTimerOptions {
  initialTime: number;   // seconds remaining (from server)
  onExpire?: () => void;
}

export function usePollTimer({ initialTime, onExpire }: UsePollTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref up to date
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Reset when initialTime changes (e.g. new poll, or late-join sync)
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onExpireRef.current?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [initialTime]); // restart only when initialTime changes

  // Format as MM:SS
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const formatted = `${minutes}:${seconds}`;

  return { timeLeft, formatted };
}
