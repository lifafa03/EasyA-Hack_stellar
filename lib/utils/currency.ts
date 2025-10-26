/**
 * Currency Formatting Utilities
 * Provides consistent USDC and XLM formatting across the application
 */

/**
 * Format a number or string as USDC with proper formatting
 * @param amount - The amount to format (number or string)
 * @param options - Formatting options
 * @returns Formatted USDC string (e.g., "$1,234.56 USDC")
 */
export function formatUSDC(
  amount: number | string,
  options: {
    showSymbol?: boolean;
    showCurrency?: boolean;
    decimals?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    showCurrency = true,
    decimals = 2,
  } = options;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showCurrency ? '$0.00 USDC' : '$0.00';
  }

  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let result = '';
  if (showSymbol) {
    result += '$';
  }
  result += formatted;
  if (showCurrency) {
    result += ' USDC';
  }

  return result;
}

/**
 * Format a number or string as XLM with proper formatting
 * @param amount - The amount to format (number or string)
 * @param options - Formatting options
 * @returns Formatted XLM string (e.g., "10.50 XLM")
 */
export function formatXLM(
  amount: number | string,
  options: {
    showCurrency?: boolean;
    decimals?: number;
  } = {}
): string {
  const {
    showCurrency = true,
    decimals = 2,
  } = options;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showCurrency ? '0.00 XLM' : '0.00';
  }

  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showCurrency ? `${formatted} XLM` : formatted;
}

/**
 * Format a balance display with USDC primary and XLM secondary
 * @param usdcBalance - USDC balance
 * @param xlmBalance - XLM balance
 * @returns Object with formatted strings
 */
export function formatBalanceDisplay(
  usdcBalance: number | string | null,
  xlmBalance: number | string | null
): {
  primary: string;
  secondary: string;
  combined: string;
} {
  const usdc = formatUSDC(usdcBalance || 0);
  const xlm = formatXLM(xlmBalance || 0);

  return {
    primary: usdc,
    secondary: xlm,
    combined: `${usdc} • ${xlm}`,
  };
}

/**
 * Parse a USDC string back to a number
 * @param usdcString - Formatted USDC string (e.g., "$1,234.56 USDC")
 * @returns Numeric value
 */
export function parseUSDC(usdcString: string): number {
  const cleaned = usdcString.replace(/[$,\sUSDC]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format a compact USDC amount (e.g., "$1.2K USDC", "$5M USDC")
 * @param amount - The amount to format
 * @returns Compact formatted string
 */
export function formatCompactUSDC(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '$0 USDC';
  }

  if (numAmount >= 1_000_000) {
    return `$${(numAmount / 1_000_000).toFixed(1)}M USDC`;
  } else if (numAmount >= 1_000) {
    return `$${(numAmount / 1_000).toFixed(1)}K USDC`;
  } else {
    return formatUSDC(numAmount);
  }
}

/**
 * Format a percentage value
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
