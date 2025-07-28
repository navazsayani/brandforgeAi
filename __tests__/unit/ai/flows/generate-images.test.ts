/**
 * @jest-environment jsdom
 */

import { generateImages } from '@/ai/flows/generate-images'
import { ai } from '@/ai/genkit'

// Mock the AI instance
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
    defineFlow: jest.fn(),
  },
}))

// Mock model config
jest.mock('@/lib/model-config', () => ({
  getModelConfig: jest.fn().mockResolvedValue({
    imageGenerationModel: 'gemini-pro-vision',
    textToImageModel: 'gemini-pro',
  }),
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  decodeHtmlEntitiesInUrl: jest.fn((url: string) => url),
  verifyImageUrlExists: jest.fn().mockResolvedValue(true),
}))

// Mock describe image flow
jest.mock('@/ai/flows/describe-image-flow', () => ({
  describeImage: jest.fn().mockResolvedValue({
    description: 'A professional office workspace with modern furniture',
  }),
}))

describe('Generate Images Flow', () => {
  const mockAiGenerate = ai.generate as jest.MockedFunction<typeof ai.generate>
  const mockDefineFlow = ai.defineFlow as jest.MockedFunction<typeof ai.defineFlow>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock the flow definition to return the actual implementation
    mockDefineFlow.mockImplementation((config, implementation) => {
      return implementation as any
    })
  })

  describe('Input Validation', () => {
    test('should validate required brand description', async () => {
      const invalidInput = {
        brandDescription: '',
        imageStyle: 'professional',
      }

      await expect(generateImages(invalidInput as any)).rejects.toThrow()
    })

    test('should validate required image style', async () => {
      const invalidInput = {
        brandDescription: 'A modern tech company',
        imageStyle: '',
      }

      await expect(generateImages(invalidInput as any)).rejects.toThrow()
    })

    test('should accept valid input parameters', async () => {
      const validInput = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        numberOfImages: 1,
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      // This should not throw
      await expect(generateImages(validInput)).resolves.toBeDefined()
    })
  })

  describe('Provider Selection', () => {
    test('should default to GEMINI provider when none specified', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      const result = await generateImages(input)

      expect(result.providerUsed).toBe('GEMINI')
    })

    test('should use specified provider', async () => {
      const input = {
        provider: 'FREEPIK' as const,
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
      }

      // Mock Freepik API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            task_id: 'mock-task-123',
            status: 'COMPLETED',
            generated: ['https://example.com/image1.jpg'],
          },
        }),
      })

      const result = await generateImages(input)

      expect(result.providerUsed).toBe('FREEPIK')
    })

    test('should handle FREEPIK provider with styling options', async () => {
      const input = {
        provider: 'FREEPIK' as const,
        brandDescription: 'A modern tech company',
        imageStyle: 'photo',
        freepikStylingColors: [
          { color: '#FF0000', weight: 0.7 },
          { color: '#00FF00', weight: 0.3 },
        ],
        freepikEffectColor: 'sepia',
        freepikEffectLightning: 'warm',
        freepikEffectFraming: 'portrait',
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            task_id: 'mock-task-123',
            status: 'COMPLETED',
            generated: ['https://example.com/styled-image.jpg'],
          },
        }),
      })

      const result = await generateImages(input)

      expect(result.providerUsed).toBe('FREEPIK')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.freepik.com/v1/ai/text-to-image/imagen3',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"colors"'),
        })
      )
    })
  })

  describe('Prompt Construction', () => {
    test('should build comprehensive prompts from brand data', async () => {
      const input = {
        brandDescription: 'An eco-friendly startup focused on sustainable technology',
        industry: 'Technology',
        imageStyle: 'modern minimalist',
        targetKeywords: 'sustainability, innovation, green tech',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      await generateImages(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('eco-friendly startup'),
            }),
          ]),
        })
      )
    })

    test('should incorporate example images when provided', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        exampleImage: 'https://example.com/reference.jpg',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      await generateImages(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              media: { url: 'https://example.com/reference.jpg' },
            }),
          ]),
        })
      )
    })

    test('should use finalized text prompt when provided', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        finalizedTextPrompt: 'Create a stunning logo for a tech startup with blue and silver colors',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      await generateImages(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Create a stunning logo for a tech startup'),
            }),
          ]),
        })
      )
    })

    test('should include aspect ratio requirements in prompt', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        aspectRatio: '16:9',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      await generateImages(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('aspect ratio of exactly **16:9**'),
            }),
          ]),
        })
      )
    })

    test('should include negative prompt when specified', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        negativePrompt: 'blurry, low quality, distorted',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      await generateImages(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Avoid the following elements'),
            }),
          ]),
        })
      )
    })
  })

  describe('Multiple Image Generation', () => {
    test('should generate multiple images when requested', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        numberOfImages: 3,
      }

      // Mock multiple AI calls
      mockAiGenerate
        .mockResolvedValueOnce({
          media: { url: 'data:image/png;base64,mockimage1' },
        } as any)
        .mockResolvedValueOnce({
          media: { url: 'data:image/png;base64,mockimage2' },
        } as any)
        .mockResolvedValueOnce({
          media: { url: 'data:image/png;base64,mockimage3' },
        } as any)

      const result = await generateImages(input)

      expect(result.generatedImages).toHaveLength(3)
      expect(mockAiGenerate).toHaveBeenCalledTimes(3)
    })

    test('should include batch generation instructions in prompts', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        numberOfImages: 2,
      }

      mockAiGenerate
        .mockResolvedValueOnce({
          media: { url: 'data:image/png;base64,mockimage1' },
        } as any)
        .mockResolvedValueOnce({
          media: { url: 'data:image/png;base64,mockimage2' },
        } as any)

      await generateImages(input)

      // Check that batch instructions are included
      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('image 1 of a set of 2'),
            }),
          ]),
        })
      )

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('image 2 of a set of 2'),
            }),
          ]),
        })
      )
    })
  })

  describe('Error Handling', () => {
    test('should handle AI generation failures gracefully', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
      }

      mockAiGenerate.mockRejectedValueOnce(new Error('AI service unavailable'))

      await expect(generateImages(input)).rejects.toThrow('AI service unavailable')
    })

    test('should handle invalid AI responses', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: null, // Invalid response
      } as any)

      await expect(generateImages(input)).rejects.toThrow()
    })

    test('should handle network errors for external providers', async () => {
      const input = {
        provider: 'FREEPIK' as const,
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
      }

      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))

      await expect(generateImages(input)).rejects.toThrow('Network error')
    })

    test('should handle Freepik API errors', async () => {
      const input = {
        provider: 'FREEPIK' as const,
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          title: 'Rate limit exceeded',
          detail: 'Too many requests',
        }),
      })

      await expect(generateImages(input)).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('Seed and Reproducibility', () => {
    test('should include seed in prompt when provided', async () => {
      const input = {
        brandDescription: 'A modern tech company',
        imageStyle: 'professional',
        seed: 12345,
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      await generateImages(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Use seed: 12345'),
            }),
          ]),
        })
      )
    })
  })

  describe('Industry-Specific Adaptations', () => {
    test('should adapt prompts for different industries', async () => {
      const input = {
        brandDescription: 'A healthcare technology company',
        industry: 'Healthcare',
        imageStyle: 'professional',
      }

      mockAiGenerate.mockResolvedValueOnce({
        media: { url: 'data:image/png;base64,mockimage' },
      } as any)

      await generateImages(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Healthcare industry'),
            }),
          ]),
        })
      )
    })
  })
})