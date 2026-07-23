/**
 * Formats a date string to a readable format (e.g., "Jan 20, 2:30 PM")
 * @param dateString - ISO date string to format
 * @returns Formatted date string or 'N/A' or 'Invalid Date' if invalid
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats a date string to show only the time (e.g., "2:30 PM")
 * @param dateString - ISO date string to format
 * @returns Formatted time string or 'N/A' or 'Invalid Date' if invalid
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats a date string to show the day and month (e.g., "Mon, Jan 20")
 * @param dateString - ISO date string to format
 * @returns Formatted day string or 'N/A' or 'Invalid Date' if invalid
 */
export const formatDay = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a date string to show full date and time (e.g., "Monday, January 20, 2026, 2:30 PM")
 * @param dateString - ISO date string to format
 * @returns Formatted full date string or 'N/A' or 'Invalid Date' if invalid
 */
export const formatDateFull = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats a number as a currency string
 * @param price - The price to format
 * @param currency - The currency code (default: 'ZAR')
 * @returns Formatted currency string
 */
export const formatPrice = (
  price: number,
  currency: string = "ZAR",
): string => {
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price?.toFixed(2) || "0.00"}`;
  }
};
