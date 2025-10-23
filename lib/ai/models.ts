export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-2",
    description: "Local GPT-2 model for text generation",
  },
  {
    id: "chat-model-reasoning",
    name: "DistilGPT-2",
    description: "Faster, distilled version of GPT-2",
  },
];
