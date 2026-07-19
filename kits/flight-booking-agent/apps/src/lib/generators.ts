export const generateBookingRef = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateBookingId = (): string => {
  return `bok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};
