import { UnitPreference } from '../types';

/**
 * Formats a volume in milliliters according to the user's preferred display unit ('ml' or 'L').
 * Note: Database storage always stays in milliliters (ml).
 */
export function formatVolume(amountMl: number, unit: UnitPreference = 'ml'): string {
  const safeMl = Math.max(0, Math.round(amountMl || 0));
  if (unit === 'L') {
    const liters = safeMl / 1000;
    const formatted = Number(liters.toFixed(2)).toString();
    return `${formatted} L`;
  }
  return `${safeMl} ml`;
}

/**
 * Formats a volume with explicit decimals (e.g. 2.50 L or 2500 ml).
 */
export function formatVolumeExact(amountMl: number, unit: UnitPreference = 'ml'): string {
  const safeMl = Math.max(0, amountMl || 0);
  if (unit === 'L') {
    return `${(safeMl / 1000).toFixed(2)} L`;
  }
  return `${Math.round(safeMl)} ml`;
}

/**
 * Converts stored milliliters to the display value number.
 */
export function mlToDisplayValue(amountMl: number, unit: UnitPreference = 'ml'): number {
  if (unit === 'L') {
    return Number((amountMl / 1000).toFixed(2));
  }
  return Math.round(amountMl);
}

/**
 * Converts a user input display value to stored milliliters.
 */
export function displayValueToMl(displayValue: number, unit: UnitPreference = 'ml'): number {
  if (unit === 'L') {
    return Math.round(displayValue * 1000);
  }
  return Math.round(displayValue);
}

export interface ValidationResult {
  isValid: boolean;
  amountMl: number;
  errorMessage?: string;
}

/**
 * Validates daily hydration goal input.
 * Allows values between 500 ml and 10,000 ml (0.5 L to 10 L).
 */
export function validateDailyGoal(goalInput: string, unit: UnitPreference = 'ml'): ValidationResult {
  const trimmed = goalInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: 'Please enter a hydration goal.',
    };
  }

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: 'Goal must be a valid number.',
    };
  }

  const amountMl = displayValueToMl(parsed, unit);

  if (amountMl < 500) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: unit === 'L' ? 'Daily goal should be at least 0.5 L.' : 'Daily goal should be at least 500 ml.',
    };
  }

  if (amountMl > 10000) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: unit === 'L' ? 'Daily goal cannot exceed 10 L.' : 'Daily goal cannot exceed 10,000 ml.',
    };
  }

  return {
    isValid: true,
    amountMl,
  };
}

/**
 * Validates a single drink amount input.
 * Allows values between 50 ml and 2,000 ml (0.05 L to 2 L).
 */
export function validateDrinkAmount(amountInput: string, unit: UnitPreference = 'ml'): ValidationResult {
  const trimmed = amountInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: 'Please enter a drink amount.',
    };
  }

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: 'Amount must be a valid number.',
    };
  }

  const amountMl = displayValueToMl(parsed, unit);

  if (amountMl < 50) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: unit === 'L' ? 'Amount must be at least 0.05 L.' : 'Amount must be at least 50 ml.',
    };
  }

  if (amountMl > 2000) {
    return {
      isValid: false,
      amountMl: 0,
      errorMessage: unit === 'L' ? 'Amount cannot exceed 2 L.' : 'Amount cannot exceed 2,000 ml.',
    };
  }

  return {
    isValid: true,
    amountMl,
  };
}
