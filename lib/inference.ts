//hello this is a test to force re-deploy`

import { generateText } from './ai/transformers-model';

/**
 * Inference endpoint to make predictions using open-weight model
 * Uses Transformers.js with GPT-2 for text generation
 *
 * @param prompt - The input text prompt
 * @returns Promise with generated text response
 */
const inference = async (prompt: string): Promise<string> => {
  try {
    const result = await generateText(prompt);
    return result;
  } catch (error) {
    console.error('Inference error:', error);
    throw new Error(`Model inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default inference; 


