import { describe, it, expect, vi, beforeEach } from 'vitest';
import inference from '@/lib/inference';
import * as transformersModel from '@/lib/ai/transformers-model';

// Mock the transformers-model module
vi.mock('@/lib/ai/transformers-model', () => ({
  generateText: vi.fn(),
}));

describe('inference', () => {
  const mockGenerateText = vi.mocked(transformersModel.generateText);

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should call generateText with the provided prompt', async () => {
    const testPrompt = 'What is the capital of France?';
    const expectedResponse = 'What is the capital of France? Paris is the capital of France.';

    mockGenerateText.mockResolvedValue(expectedResponse);

    const result = await inference(testPrompt);

    expect(mockGenerateText).toHaveBeenCalledWith(testPrompt, {
      modelId: 'distilgpt2',
    });
    expect(result).toBe(expectedResponse);
  });

  it('should return a string response', async () => {
    const testPrompt = 'Test prompt';
    const expectedResponse = 'Test prompt generated response';

    mockGenerateText.mockResolvedValue(expectedResponse);

    const result = await inference(testPrompt);

    expect(typeof result).toBe('string');
    expect(result).toBe(expectedResponse);
  });

  it('should handle errors from the model', async () => {
    const testPrompt = 'Test prompt';
    const error = new Error('Model loading failed');

    mockGenerateText.mockRejectedValue(error);

    await expect(inference(testPrompt)).rejects.toThrow('Model inference failed');
  });

  it('should handle empty prompts', async () => {
    const emptyPrompt = '';
    const expectedResponse = '';

    mockGenerateText.mockResolvedValue(expectedResponse);

    const result = await inference(emptyPrompt);

    expect(mockGenerateText).toHaveBeenCalledWith(emptyPrompt, {
      modelId: 'distilgpt2',
    });
    expect(result).toBe(expectedResponse);
  });

  it('should wrap errors with descriptive message', async () => {
    const testPrompt = 'Test prompt';
    const originalError = new Error('Network timeout');

    mockGenerateText.mockRejectedValue(originalError);

    await expect(inference(testPrompt)).rejects.toThrow('Model inference failed: Network timeout');
  });
});
