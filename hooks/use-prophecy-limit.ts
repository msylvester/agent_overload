"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorageSafe } from "./use-local-storage-safe";

const PROPHECY_LIMIT = 5;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface ProphecyData {
  count: number;
  lastReset: number;
}

const getInitialData = (): ProphecyData => ({
  count: 0,
  lastReset: Date.now(),
});

export function useProphecyLimit() {
  const [data, setData] = useLocalStorageSafe<ProphecyData>(
    "prophecy-limit",
    getInitialData()
  );

  // Check if 24 hours have passed and reset if needed
  const currentData = useMemo(() => {
    const now = Date.now();
    if (now - data.lastReset >= TWENTY_FOUR_HOURS_MS) {
      return { count: 0, lastReset: now };
    }
    return data;
  }, [data]);

  const prophecyCount = currentData.count;
  const isLimitReached = prophecyCount >= PROPHECY_LIMIT;
  const remainingProphecies = Math.max(0, PROPHECY_LIMIT - prophecyCount);

  const incrementProphecy = useCallback(() => {
    setData((prev) => {
      const now = Date.now();
      // Reset if 24 hours have passed
      if (now - prev.lastReset >= TWENTY_FOUR_HOURS_MS) {
        return { count: 1, lastReset: now };
      }
      return { ...prev, count: prev.count + 1 };
    });
  }, [setData]);

  // Reset data if 24 hours have passed (sync localStorage with computed state)
  if (currentData !== data) {
    setData(currentData);
  }

  return {
    prophecyCount,
    incrementProphecy,
    isLimitReached,
    remainingProphecies,
  };
}
