import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export currency utilities for convenience
export {
  formatUSDC,
  formatXLM,
  formatBalanceDisplay,
  parseUSDC,
  formatCompactUSDC,
  formatPercentage,
} from './utils/currency'
