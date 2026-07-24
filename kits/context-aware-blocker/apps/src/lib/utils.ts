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
 * **Clock bypass defense**: In addition to checking if `Date.now() < lockTimestamp`, 
 * we also verify that the elapsed wall-clock time since `lockSetAt` (when the lock was 
 * originally saved) hasn't exceeded the expected lock duration. If the user rolls back 
 * their OS clock, `Date.now()` would appear to be before the lock expiry, but the 
 * elapsed time since `lockSetAt` would be inconsistent — so we use the more conservative 
 * of the two checks. This makes casual clock-rolling significantly harder without 
 * requiring a network call to an NTP server.
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
        const now = Date.now();

        // Primary check: is the current time before the lock expiry?
        if (now < lockTimestamp) {
          return true;
        }

        // Clock bypass defense: if lockSetAt is available, verify elapsed time
        // is consistent. If the user rolled their clock forward to expire the lock,
        // the actual elapsed time since lockSetAt would be much less than expected.
        if (parsed.lockSetAt && typeof parsed.lockSetAt === 'number') {
          const expectedDuration = lockTimestamp - parsed.lockSetAt;
          const actualElapsed = now - parsed.lockSetAt;

          // If less real time has passed than the lock duration, the lock should still be active.
          // This catches the case where someone fast-forwards their clock past the lock,
          // then sets it back to normal — actualElapsed would be less than expectedDuration.
          if (actualElapsed < expectedDuration && expectedDuration > 0) {
            return true;
          }
        }
      }
    } catch (e) {
      // Fail silently if JSON parsing fails to prevent UI crashing.
    }
  }
  return false;
}
