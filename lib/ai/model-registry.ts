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
  'gpt2': {
    transformersModelName: 'Xenova/gpt2',
    displayName: 'GPT-2',
    defaultParams: {
      maxNewTokens: 50,
      temperature: 0.7,
      topK: 50,
    },
  },
  'distilgpt2': {
    transformersModelName: 'Xenova/distilgpt2',
    displayName: 'DistilGPT-2',
    defaultParams: {
      maxNewTokens: 50,
      temperature: 0.7,
      topK: 50,
    },
  },
};

/**
 * Default model ID used when no model is specified
 */
export const DEFAULT_MODEL_ID = 'distilgpt2';

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
