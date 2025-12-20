"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Client-side debug logging - only logs in development
const isDev = process.env.NODE_ENV !== "production";
const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};
const debugError = (...args: unknown[]) => {
  if (isDev) console.error(...args);
};

import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useProphecyLimit } from "@/hooks/use-prophecy-limit";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { SidePanel } from "./side-panel";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { incrementProphecy, isLimitReached, remainingProphecies } =
    useProphecyLimit();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  // Custom message state management (replacing useChat)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<"ready" | "submitted">("ready");

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Poll for job completion
  const pollJobStatus = useCallback(
    async (jobId: string): Promise<ChatMessage | null> => {
      const maxAttempts = 120; // 2 minutes with 1s intervals
      const pollInterval = 1000; // 1 second
      debugLog("[pollJobStatus] Starting to poll for job:", jobId);

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          debugLog(`[pollJobStatus] Attempt ${attempt + 1}/${maxAttempts}`);
          const response = await fetch(`/api/job/${jobId}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch job status: ${response.status}`);
          }

          const data = await response.json();
          debugLog("[pollJobStatus] Job status:", data.status);

          if (data.status === "completed") {
            debugLog("[pollJobStatus] Job completed!", data.result);
            return data.result as ChatMessage;
          }

          if (data.status === "failed") {
            debugError("[pollJobStatus] Job failed:", data.error);
            throw new Error(data.error || "Job failed");
          }

          // Job is still pending or processing, wait and try again
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        } catch (error) {
          debugError("Error polling job status:", error);
          throw error;
        }
      }

      throw new Error("Job timed out");
    },
    []
  );

  // Custom sendMessage function that POSTs to local inference endpoint
  const sendMessage = useCallback(
    async (message: ChatMessage) => {
      debugLog("[sendMessage] Called with:", message);

      // Check rate limit before sending
      if (isLimitReached) {
        toast({
          type: "error",
          description:
            "You have reached your daily limit of 5 queries. Please try again tomorrow.",
        });
        return;
      }

      setStatus("submitted");

      // Add user message to UI immediately
      setMessages((prev) => [...prev, message]);

      try {
        debugLog("[sendMessage] Sending fetch to /api/chat");
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            message,
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
          }),
        });
        debugLog("[sendMessage] Fetch response:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        debugLog("[sendMessage] Response data:", data);

        // Check if we got a jobId (background processing) or direct message
        debugLog("[sendMessage] Checking for jobId:", !!data.jobId);
        if (data.jobId) {
          debugLog("[sendMessage] Starting poll for jobId:", data.jobId);
          // Poll for job completion
          const assistantMessage = await pollJobStatus(data.jobId);
          debugLog("[sendMessage] Poll returned:", assistantMessage);
          if (assistantMessage) {
            setMessages((prev) => [...prev, assistantMessage]);
          }
        } else if (data.message) {
          // Direct response (fallback for sync processing)
          setMessages((prev) => [...prev, data.message]);
        }

        // Increment query count on successful send
        incrementProphecy();
        mutate(unstable_serialize(getChatHistoryPaginationKey));
      } catch (error) {
        debugError("Error sending message:", error);
        toast({
          type: "error",
          description: "Failed to send message. Please try again.",
        });
      } finally {
        setStatus("ready");
      }
    },
    [
      id,
      visibilityType,
      mutate,
      pollJobStatus,
      isLimitReached,
      incrementProphecy,
    ]
  );

  const stop = useCallback(async () => {
    setStatus("ready");
  }, []);

  const regenerate = useCallback(async () => {
    // No-op for now since we don't have regeneration with local inference
  }, []);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        id: generateUUID(),
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={undefined}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
            />
          )}
        </div>

        {/* Bottom Info Panel */}
        <div className="mx-auto w-full max-w-4xl px-2 pb-4 md:px-4">
          <SidePanel />
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={undefined}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
