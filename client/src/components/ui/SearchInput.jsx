import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSearch, HiX } from 'react-icons/hi';

export default function SearchInput({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  autoFocus = false,
  className = '',
  size = 'md',
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  const sizeStyles = {
    sm: 'py-1.5 pl-8 pr-8 text-xs',
    md: 'py-2.5 pl-10 pr-10 text-sm',
    lg: 'py-3.5 pl-12 pr-12 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const debouncedChange = useCallback(
    (newValue) => {
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

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onSearch?.(localValue);
      onChange?.(localValue);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <HiSearch
        className={`
          absolute left-3 top-1/2 -translate-y-1/2
          ${iconSizes[size] || iconSizes.md}
          ${isFocused ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}
          transition-colors duration-200
        `}
      />

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full rounded-xl
          bg-white dark:bg-gray-800/80
          border border-gray-200 dark:border-gray-700
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500
          transition-all duration-200
          ${sizeStyles[size] || sizeStyles.md}
        `}
      />

      <AnimatePresence>
        {localValue && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            type="button"
            onClick={handleClear}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              p-0.5 rounded-full
              text-gray-400 dark:text-gray-500
              hover:text-gray-600 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
            `}
            aria-label="Clear search"
          >
            <HiX className={iconSizes[size] || iconSizes.md} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
