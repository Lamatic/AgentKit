import { useState, useEffect } from 'react';

export function useDebouncedQuantity(value: number, timeInMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, timeInMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, timeInMs]);

  return debouncedValue;
}