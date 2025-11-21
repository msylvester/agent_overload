import { pipeline, type TextGenerationPipeline } from '@huggingface/transformers';
import {
  getModelConfig,
  DEFAULT_MODEL_ID,
  isValidModelId,
  type ModelConfig
} from './model-registry';

/**
 * Singleton pattern for loading text generation models
 * Supports multiple models with lazy loading and caching
 */


class TransformersModelSingleton {

  private static instance: TransformersModelSingleton;
  private modelPipelines: Map<string, Promise<TextGenerationPipeline>> = new Map();

  private constructor() {}

  static getInstance(): TransformersModelSingleton {
    if (!TransformersModelSingleton.instance) {
      TransformersModelSingleton.instance = new TransformersModelSingleton();
    }
    return TransformersModelSingleton.instance;
  }

  /**
   * Get or load the text generation pipeline for a specific model
   * Models are cached after first load
   *
   * @param modelId - The model identifier from the registry
   * @returns Promise<TextGenerationPipeline>
   * @throws Error if modelId is invalid
   */
  async getModel(modelId: string = DEFAULT_MODEL_ID): Promise<TextGenerationPipeline> {
    if (!isValidModelId(modelId)) {
      throw new Error(`Invalid model ID: ${modelId}. Use one of: ${Object.keys(getModelConfig)}`);
    }

    const config = getModelConfig(modelId);
    if (!config) {
      throw new Error(`Model configuration not found for: ${modelId}`);
    }

    if (!this.modelPipelines.has(modelId)) {
      console.log(`Loading model: ${config.transformersModelName} (${modelId})...`);
      const modelPromise = pipeline('text-generation', config.transformersModelName);
      this.modelPipelines.set(modelId, modelPromise);

      // Log when loading completes
      modelPromise.then(() => {
        console.log(`Model ${config.transformersModelName} (${modelId}) loaded successfully`);
      }).catch(error => {
        console.error(`Failed to load model ${modelId}:`, error);
        // Remove failed promise so it can be retried
        this.modelPipelines.delete(modelId);
      });
    }

    return this.modelPipelines.get(modelId)!;
  }
}

/**
 * Generate text using the specified model
 *
 * @param prompt - The input text prompt
 * @param options - Generation options
 * @param options.modelId - Model identifier from registry (defaults to DEFAULT_MODEL_ID)
 * @param options.maxNewTokens - Maximum new tokens to generate
 * @param options.temperature - Sampling temperature
 * @param options.topK - Top-k sampling parameter
 * @returns Generated text completion
 */
export async function generateText(
  prompt: string,
  options: {
    modelId?: string;
    maxNewTokens?: number;
    temperature?: number;
    topK?: number;
  } = {}
): Promise<string> {
  const { modelId = DEFAULT_MODEL_ID, ...generationOptions } = options;

  // Get model config for defaults
  const config = getModelConfig(modelId);
  if (!config) {
    throw new Error(`Model configuration not found for: ${modelId}`);
  }

  // Merge with config defaults
  const {
    maxNewTokens = config.defaultParams.maxNewTokens,
    temperature = config.defaultParams.temperature,
    topK = config.defaultParams.topK,
  } = generationOptions;

  try {
    //TODO: generate the text as a response to the query to agent_007;
//    const model = await TransformersModelSingleton.getInstance().getModel(modelId);
/**
    const result = await model(prompt, {
      max_new_tokens: maxNewTokens,
      temperature,
      top_k: topK,
      do_sample: true,
    });

    // Extract generated text from result
    // Handle both single and array outputs
    const generatedText = Array.isArray(result)
      ? (result[0] as any)?.generated_text || ''
      : (result as any)?.generated_text || '';

    // Strip the original prompt from the output
    // The Transformers library returns the full text (prompt + completion)
    // We only want the newly generated tokens
    const completion = generatedText.startsWith(prompt)
      ? generatedText.slice(prompt.length)
      : generatedText;

    return completion;
    */
    // TODO: Implement model inference - returning empty string for now
    return '';
  } catch (error) {
    console.error('Text generation error:', error);
    throw error;
  }
}
