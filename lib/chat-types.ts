/**
 * Custom chat types to replace AI SDK's UseChatHelpers
 * These are used for local inference without streaming
 */

import type { Dispatch, SetStateAction } from "react";
import type { ChatMessage } from "./types";

export type ChatStatus = "ready" | "submitted";

export type ChatSendMessage = (message: ChatMessage) => Promise<void>;

export type ChatSetMessages = Dispatch<SetStateAction<ChatMessage[]>>;

export type ChatRegenerate = () => Promise<void>;

export type ChatStop = () => Promise<void>;
