/**
 * Conditionally joins class names together.
 * 
 * This utility acts as a lightweight alternative to the `classnames` or `clsx` 
 * libraries, providing a standard way to compose Tailwind CSS classes dynamically.
 * 
 * @param {...(string | undefined | null | false)[]} classes - An array of class names or falsy values.
 * @returns {string} A space-separated string of valid class names.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Checks if the application is currently under a strict lock mode.
 * 
 * This prevents the user from circumventing block rules by disabling the extension
 * or modifying the UI. It reads the globally synced `lama_lock_settings` from localStorage.
 * 
 * @returns {boolean} True if the current time is before the locked time, false otherwise.
 */
export function isStrictLockActive(): boolean {
  // NOTE: Next.js SSR guard. localStorage is not available on the server.
  if (typeof window === 'undefined') return false;
  
  const saved = localStorage.getItem("lama_lock_settings");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.date && parsed.time) {
        const lockTimestamp = new Date(`${parsed.date}T${parsed.time}`).getTime();
        // FIXME: This relies on the client's local system clock. A dedicated user could 
        // bypass this by rolling back their OS clock. Future improvement should use an NTP server.
        if (Date.now() < lockTimestamp) {
          return true;
        }
      }
    } catch (e) {
      // Fail silently if JSON parsing fails to prevent UI crashing.
    }
  }
  return false;
}
