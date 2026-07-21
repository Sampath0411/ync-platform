import { useState, useEffect, useRef, useCallback } from 'react';
import { HiSearch } from 'react-icons/hi';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange?.(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
          bg-white dark:bg-gray-800/80
          border border-gray-200 dark:border-gray-700
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500
          transition-all duration-200
        "
      />
    </div>
  );
}
