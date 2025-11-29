"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";

interface UseJobPollingReturn {
  data: ChatMessage | null;
  error: Error | null;
  isLoading: boolean;
}

export function useJobPolling(jobId: string | null): UseJobPollingReturn {
  const [data, setData] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pollJobStatus = useCallback(async (id: string): Promise<void> => {
    const maxAttempts = 120; // 2 minutes with 1s intervals
    const pollInterval = 1000; // 1 second

    setIsLoading(true);
    setError(null);
    setData(null);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/job/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch job status: ${response.status}`);
        }

        const jobData = await response.json();

        if (jobData.status === "completed") {
          setData(jobData.result as ChatMessage);
          setIsLoading(false);
          return;
        }

        if (jobData.status === "failed") {
          throw new Error(jobData.error || "Job failed");
        }

        // Job is still pending or processing, wait and try again
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
        return;
      }
    }

    // Timeout after max attempts
    setError(new Error("Job timed out"));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (jobId) {
      pollJobStatus(jobId);
    }
  }, [jobId, pollJobStatus]);

  return { data, error, isLoading };
}
