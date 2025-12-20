import { DEFAULT_MODEL_ID, isValidModelId } from "./ai/model-registry";
import { generateText } from "./ai/transformers-model";

/**
 * Inference endpoint to make predictions using open-weight models
 * Supports multiple models via model registry
 *
 * Model selection priority:
 * 1. options.modelId parameter
 * 2. DEFAULT_MODEL_ID from registry
 *
 * @param prompt - The input text prompt
 * @param options - Inference options
 * @param options.modelId - Model identifier from registry
 * @param options.maxNewTokens - Maximum new tokens to generate
 * @param options.temperature - Sampling temperature
 * @param options.topK - Top-k sampling parameter
 * @returns Promise with generated text response
 *
 * @example
 * // Use default model
 * const result = await inference("Hello world");
 *
 * @example
 * // Use specific model
 * const result = await inference("Hello world", { modelId: "distilgpt2" });
 */
const inference = async (
  prompt: string,
  options: {
    modelId?: string;
    maxNewTokens?: number;
    temperature?: number;
    topK?: number;
  } = {}
): Promise<string> => {
  try {
    // Determine model to use (priority: parameter > default)
    const modelId = options.modelId || DEFAULT_MODEL_ID;

    // Validate model ID
    if (!isValidModelId(modelId)) {
      throw new Error(
        `Invalid model ID: ${modelId}. Please pass a valid modelId option.`
      );
    }

    console.log(`Using model: ${modelId}`);

    const result = await generateText(prompt, {
      ...options,
      modelId,
    });

    return result;
  } catch (error) {
    console.error("Inference error:", error);
    throw new Error(
      `Model inference failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

export default inference;
