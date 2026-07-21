import { useState, useEffect } from 'react';

function getTimeRemaining(targetDate) {
  const total = new Date(targetDate) - new Date();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, expired: false };
}

export default function CountdownTimer({ targetDate, onExpired, className = '' }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(targetDate);
      setTimeLeft(remaining);
      if (remaining.expired) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onExpired]);

  if (timeLeft.expired) {
    return (
      <div className={`text-center ${className}`}>
        <span className="text-red-500 dark:text-red-400 font-medium text-sm">
          Event has started
        </span>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-2">
          <div className="text-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 min-w-[2.5rem]">
              <span className="text-sm font-bold font-display text-gray-900 dark:text-white tabular-nums">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
              {unit.label}
            </span>
          </div>
          {index < units.length - 1 && (
            <span className="text-gray-300 dark:text-gray-600 font-bold text-sm mt-[-1rem]">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
