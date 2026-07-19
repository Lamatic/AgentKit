/**
 * Generates a random 6-character booking reference
 * @returns Alphanumeric booking reference (e.g., "X7K9M2")
 */
export const generateBookingRef = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a unique booking ID with timestamp
 * @returns Booking ID (e.g., "bok_1723456789012")
 */
export const generateBookingId = (): string => {
  return `bok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};
