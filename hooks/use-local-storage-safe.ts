"use client";

import { useCallback, useEffect, useState } from "react";

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Check if localStorage exists and has functional getItem/setItem
    if (typeof localStorage?.getItem !== "function") return false;
    if (typeof localStorage?.setItem !== "function") return false;

    // Test that it actually works
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function useLocalStorageSafe<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;

        if (isLocalStorageAvailable()) {
          try {
            localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
          }
        }

        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
