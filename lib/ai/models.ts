export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "llama-chat-model",
    name: "Llama 3.2 1B Instruct",
    description: "Small instruction-tuned Llama model",
  },
  {
    id: "llama-3.1-8b-chat-model",
    name: "Llama 3.1 8B Instruct",
    description: "Larger instruction-tuned Llama model with enhanced capabilities",
  },
];
