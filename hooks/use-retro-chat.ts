"use client";

import { useCallback, useState } from "react";
import { generateUUID } from "@/lib/utils";
import { useJobPolling } from "./use-job-polling";
import type { ChatMessage } from "@/lib/types";

interface SendMessageOptions {
  skipClarification?: boolean;
  dateRange?: { start: string; end: string };
}

interface UseRetroChatReturn {
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  response: ChatMessage | null;
  error: Error | null;
  isLoading: boolean;
  reset: () => void;
}

export function useRetroChat(): UseRetroChatReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const { data, error, isLoading } = useJobPolling(jobId);

  const sendMessage = useCallback(async (text: string, options?: SendMessageOptions) => {
    try {
      const chatId = generateUUID();
      const messageId = generateUUID();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            parts: [
              {
                type: "text",
                text: text,
              },
            ],
          },
          selectedChatModel: "chat-model",
          selectedVisibilityType: "private",
          ...(options?.skipClarification && { skipClarification: true }),
          ...(options?.dateRange && { dateRange: options.dateRange }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.jobId) {
        setJobId(responseData.jobId);
      } else {
        throw new Error("No jobId received from server");
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to send message");
    }
  }, []);

  const reset = useCallback(() => {
    setJobId(null);
  }, []);

  return {
    sendMessage,
    response: data,
    error,
    isLoading,
    reset,
  };
}
