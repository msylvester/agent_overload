/**
 * Model Registry
 * Central configuration for all supported transformer models
 */

export interface ModelConfig {
  /** The model name as used in Hugging Face transformers */
  transformersModelName: string;
  /** Human-readable display name */
  displayName: string;
  /** Default generation parameters */
  defaultParams: {
    maxNewTokens: number;
    temperature: number;
    topK: number;
  };
}

/**
 * Registry of available models
 * Add new models here with their configurations
 */
const MODEL_REGISTRY: Record<string, ModelConfig> = {
  "onnx-community/Llama-3.2-1B-Instruct": {
    transformersModelName: "onnx-community/Llama-3.2-1B-Instruct",
    displayName: "Llama 3.2 1B Instruct",
    defaultParams: {
      maxNewTokens: 2048,
      temperature: 0.4,
      topK: 30,
    },
  },
  "onnx-community/Llama-3.2-3B-Instruct": {
    transformersModelName: "onnx-community/Llama-3.2-3B-Instruct",
    displayName: "Llama 3.2 3B Instruct",
    defaultParams: {
      maxNewTokens: 512,
      temperature: 0.4,
      topK: 30,
    },
  },
};

/**
 * Default model ID used when no model is specified
 */
export const DEFAULT_MODEL_ID = "onnx-community/Llama-3.2-1B-Instruct";

/**
 * Get model configuration by ID
 * @param modelId - The model identifier
 * @returns ModelConfig or undefined if not found
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_REGISTRY[modelId];
}

/**
 * Check if a model ID is valid
 * @param modelId - The model identifier to validate
 * @returns true if the model exists in the registry
 */
export function isValidModelId(modelId: string): boolean {
  return modelId in MODEL_REGISTRY;
}

/**
 * Get all available model IDs
 * @returns Array of model IDs
 */
export function getAvailableModelIds(): string[] {
  return Object.keys(MODEL_REGISTRY);
}

/**
 * Mapping from UI chat model IDs to inference model IDs
 * All UI models now use Llama 3.2 1B Instruct
 */
export const UI_TO_INFERENCE_MODEL_MAP: Record<string, string> = {
  "llama-chat-model": "onnx-community/Llama-3.2-1B-Instruct",
  "llama-3.1-8b-chat-model": "onnx-community/Llama-3.1-8B-Instruct",
  "title-model": "onnx-community/Llama-3.2-1B-Instruct",
  "artifact-model": "onnx-community/Llama-3.2-1B-Instruct",
};

/**
 * Convert UI model ID to inference model ID
 * @param uiModelId - The model ID from the UI (e.g., 'chat-model')
 * @returns The corresponding inference model ID (e.g., 'gpt2')
 */
export function uiModelToInferenceModel(uiModelId: string): string {
  return UI_TO_INFERENCE_MODEL_MAP[uiModelId] || DEFAULT_MODEL_ID;
}
