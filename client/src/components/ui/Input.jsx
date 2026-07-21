import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiEye, HiEyeOff } from 'react-icons/hi';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      iconLeft: IconLeft,
      iconRight: IconRight,
      type = 'text',
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {IconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              <IconLeft className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full px-4 py-2.5 rounded-xl text-sm
              bg-white dark:bg-gray-800/80
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900
              ${IconLeft ? 'pl-10' : ''}
              ${IconRight || isPassword ? 'pr-10' : ''}
              ${error ? 'border-red-400 dark:border-red-500 focus:ring-red-500/30 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
            </button>
          )}

          {IconRight && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              <IconRight className="w-4 h-4" />
            </div>
          )}

          {/* Focus indicator animation */}
          <motion.div
            className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0, opacity: isFocused ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ originX: 0.5 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </motion.p>
          )}
          {helperText && !error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400 dark:text-gray-500"
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
