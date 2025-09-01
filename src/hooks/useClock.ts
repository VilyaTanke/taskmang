import { useState, useEffect, useMemo } from 'react';

export function useClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Memoize the formatted time to prevent recalculation on every render
  const formattedTime = useMemo(() => ({
    time: currentTime.toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }),
    date: currentTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }), [currentTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return { currentTime, formattedTime };
}
