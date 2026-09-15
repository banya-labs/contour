"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to debounce a value by a specified delay (in ms).
 * Prevents redundant re-renders, layout recalculations, and rapid API roundtrips.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
