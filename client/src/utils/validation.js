/**
 * Shared form validation utilities for the YNC client.
 * Pure functions with no dependencies — reusable across all forms.
 */

/**
 * Validate email format.
 * Returns error string or null.
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Invalid email format';
  return null;
}

/**
 * Validate password strength.
 * Returns error string or null.
 */
export function validatePassword(password, minLength = 8) {
  if (!password) return 'Password is required';
  if (password.length < minLength) return `Password must be at least ${minLength} characters`;
  return null;
}

/**
 * Validate name (2-100 chars, letters/spaces/hyphens).
 * Returns error string or null.
 */
export function validateName(name) {
  if (!name || !name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 100) return 'Name is too long';
  return null;
}

/**
 * Validate Indian mobile number (10 digits starting with 6-9).
 * Returns error string or null.
 */
export function validateMobile(mobile) {
  if (!mobile || !mobile.trim()) return 'Mobile number is required';
  const cleaned = mobile.replace(/\s+/g, '');
  if (!/^[6-9]\d{9}$/.test(cleaned)) return 'Enter a valid 10-digit mobile number';
  return null;
}

/**
 * Validate a value is not empty.
 * Returns error string or null.
 */
export function validateRequired(value, fieldName = 'This field') {
  if (value === undefined || value === null) return `${fieldName} is required`;
  if (typeof value === 'string' && !value.trim()) return `${fieldName} is required`;
  return null;
}

/**
 * Validate date of birth is not in the future.
 * Returns error string or null.
 */
export function validateDateOfBirth(dob) {
  if (!dob) return 'Date of birth is required';
  const date = new Date(dob);
  if (isNaN(date.getTime())) return 'Invalid date';
  if (date > new Date()) return 'Date of birth cannot be in the future';
  return null;
}

/**
 * Validate a general date is valid.
 * Returns error string or null.
 */
export function validateDate(dateStr, fieldName = 'Date') {
  if (!dateStr) return `${fieldName} is required`;
  if (isNaN(new Date(dateStr).getTime())) return `Invalid ${fieldName.toLowerCase()}`;
  return null;
}

/**
 * Validate URL format (optional — empty is OK).
 * Returns error string or null.
 */
export function validateUrl(url, fieldName = 'URL') {
  if (!url || !url.trim()) return null; // optional
  try {
    new URL(url.trim());
    return null;
  } catch {
    return `Invalid ${fieldName.toLowerCase()} format`;
  }
}

/**
 * Validate a numeric value is >= 0.
 * Returns error string or null.
 */
export function validateNonNegative(val, fieldName = 'Value') {
  const num = parseFloat(val);
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (num < 0) return `${fieldName} cannot be negative`;
  return null;
}

/**
 * Validate positive integer.
 * Returns error string or null.
 */
export function validatePositiveInt(val, fieldName = 'Value') {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 0) return `${fieldName} must be a positive number`;
  if (!Number.isInteger(num)) return `${fieldName} must be a whole number`;
  return null;
}

/**
 * Validate string length within bounds.
 * Returns error string or null.
 */
export function validateLength(val, min = 1, max = 1000, fieldName = 'Text') {
  if (!val || typeof val !== 'string') return `${fieldName} is required`;
  const len = val.trim().length;
  if (len < min) return `${fieldName} must be at least ${min} characters`;
  if (len > max) return `${fieldName} must be no more than ${max} characters`;
  return null;
}

/**
 * Validate confirm password matches.
 * Returns error string or null.
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}

/**
 * Calculate password strength score (0-3).
 * Same algorithm as RegisterPage for consistency.
 */
export function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 3);
}

export const strengthConfig = {
  0: { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' },
  1: { label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-500' },
  2: { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  3: { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
};
