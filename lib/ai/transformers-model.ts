/**
 * Transformers.js model wrapper for text generation
 * Uses open-weight models for local inference
 */

import { pipeline, Pipeline } from '@huggingface/transformers';

// Global pipeline instance to avoid re-initializing the model on every call
let textGenerationPipeline: Pipeline | null = null;

// Model configuration
const MODEL_NAME = 'Xenova/gpt2'; // Using GPT-2 as mentioned in the comments
const MAX_NEW_TOKENS = 50; // Maximum number of tokens to generate

/**
 * Initialize the text generation pipeline
 * Lazy loads the model on first use
 */
async function initializePipeline(): Promise<Pipeline> {
  if (!textGenerationPipeline) {
    textGenerationPipeline = await pipeline('text-generation', MODEL_NAME);
  }
  return textGenerationPipeline;
}

/**
 * Generate text using a transformer model
 * @param prompt - The input text prompt
 * @returns Promise with generated text response
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const generator = await initializePipeline();

    const result = await generator(prompt, {
      max_new_tokens: MAX_NEW_TOKENS,
      temperature: 0.7,
      do_sample: true,
      top_k: 50,
      top_p: 0.95,
    });

    // Extract the generated text from the result
    // The result is an array with a single object containing generated_text
    if (Array.isArray(result) && result.length > 0 && 'generated_text' in result[0]) {
      return result[0].generated_text;
    }

    throw new Error('Unexpected response format from model');
  } catch (error) {
    console.error('Error in generateText:', error);
    throw error;
  }
}
