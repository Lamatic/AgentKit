export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function isStrictLockActive(): boolean {
  if (typeof window === 'undefined') return false;
  
  const saved = localStorage.getItem("lama_lock_settings");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.date && parsed.time) {
        const lockTimestamp = new Date(`${parsed.date}T${parsed.time}`).getTime();
        if (Date.now() < lockTimestamp) {
          return true;
        }
      }
    } catch (e) {}
  }
  return false;
}
