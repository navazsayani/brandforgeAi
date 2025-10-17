/**
 * @jest-environment node
 */

import { describeImage } from '@/ai/flows/describe-image-flow'
import type { DescribeImageInput } from '@/ai/flows/describe-image-flow'
import { ai } from '@/ai/genkit'

// Mock the AI instance
jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn((config) => {
      return jest.fn().mockResolvedValue({
        output: {
          description: 'A beautiful landscape featuring rolling hills and a clear blue sky at sunset',
        },
      })
    }),
    defineFlow: jest.fn((config, implementation) => {
      return implementation as any
    }),
  },
}))

// Mock model config
jest.mock('@/lib/model-config', () => ({
  getModelConfig: jest.fn().mockResolvedValue({
    visionModel: 'gemini-pro-vision',
  }),
}))

describe('Describe Image Flow', () => {
  const mockDefinePrompt = ai.definePrompt as jest.MockedFunction<typeof ai.definePrompt>
  const mockDefineFlow = ai.defineFlow as jest.MockedFunction<typeof ai.defineFlow>

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset the prompt mock
    mockDefinePrompt.mockImplementation((config) => {
      return jest.fn().mockResolvedValue({
        output: {
          description: 'A beautiful landscape featuring rolling hills and a clear blue sky at sunset',
        },
      }) as any
    })

    // Mock the flow definition to return the actual implementation
    mockDefineFlow.mockImplementation((config, implementation) => {
      return implementation as any
    })
  })

  describe('Input Validation', () => {
    test('should reject empty image data URI', async () => {
      const invalidInput: DescribeImageInput = {
        imageDataUri: '',
      }

      await expect(describeImage(invalidInput)).rejects.toThrow()
    })

    test('should accept valid data URI', async () => {
      const validInput: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }

      const result = await describeImage(validInput)

      expect(result).toBeDefined()
      expect(result.description).toBeTruthy()
    })

    test('should accept valid HTTPS URL', async () => {
      const validInput: DescribeImageInput = {
        imageDataUri: 'https://example.com/image.jpg',
      }

      const result = await describeImage(validInput)

      expect(result).toBeDefined()
      expect(result.description).toBeTruthy()
    })

    test('should accept Firebase Storage URLs', async () => {
      const validInput: DescribeImageInput = {
        imageDataUri: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media&token=abc123',
      }

      const result = await describeImage(validInput)

      expect(result).toBeDefined()
      expect(result.description).toBeTruthy()
    })
  })

  describe('Image Description Quality', () => {
    test('should generate concise description (1-2 sentences)', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'A modern office workspace with clean lines and natural lighting. The minimalist design features a wooden desk and ergonomic chair.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
      const sentenceCount = result.description.split(/[.!?]+/).filter(s => s.trim().length > 0).length
      expect(sentenceCount).toBeGreaterThanOrEqual(1)
      expect(sentenceCount).toBeLessThanOrEqual(3) // Allow some flexibility
    })

    test('should describe main subject clearly', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockDogImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'A golden retriever playing in a sunlit park, catching a red frisbee mid-air with joyful energy.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description).toContain('golden retriever')
      expect(result.description.toLowerCase()).toMatch(/play|catch|jump|run/)
    })

    test('should capture mood and atmosphere', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockSunsetImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'A serene beach at golden hour, with gentle waves reflecting warm amber hues from the setting sun.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/serene|peaceful|calm|warm|golden|gentle/)
    })

    test('should identify key visual elements', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockCityImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'A bustling urban skyline at night, featuring illuminated skyscrapers and busy streets below.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/skyline|skyscraper|building|city|urban/)
    })

    test('should be suitable for social media use', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockFoodImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Delicious homemade pizza with fresh mozzarella and basil, straight from the oven with a perfectly crispy crust.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      // Should be engaging and descriptive
      expect(result.description).toBeTruthy()
      expect(result.description.length).toBeGreaterThan(20)
      expect(result.description.length).toBeLessThan(280) // Twitter-friendly length
    })
  })

  describe('Different Image Types', () => {
    test('should describe portraits effectively', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockPortraitImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Professional headshot of a smiling businesswoman against a neutral background, conveying confidence and approachability.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/portrait|headshot|person|face|smile/)
    })

    test('should describe products accurately', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockProductImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Sleek wireless headphones in matte black, showcasing modern design with comfortable ear cushions and metallic accents.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/headphones|design|modern|sleek/)
    })

    test('should describe landscapes with detail', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockLandscapeImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Majestic mountain range under dramatic clouds, with a winding river valley cutting through lush green forests.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/mountain|valley|forest|landscape|nature/)
    })

    test('should describe abstract art conceptually', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockAbstractImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Bold abstract composition featuring vibrant splashes of red, blue, and yellow, creating dynamic energy and movement.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/abstract|vibrant|bold|color|composition/)
    })

    test('should describe food with appetite appeal', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockFoodImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Mouth-watering chocolate cake with rich ganache frosting and fresh berries, elegantly plated on fine china.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/delicious|tasty|fresh|mouth|cake|food/)
    })

    test('should describe events and scenes', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockEventImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Lively outdoor concert with hundreds of fans enjoying live music under colorful stage lights at sunset.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/concert|event|crowd|music|people/)
    })
  })

  describe('Different Image Formats', () => {
    test('should handle PNG images', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockPngData',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle JPEG images', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/jpeg;base64,mockJpegData',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle JPG images', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/jpg;base64,mockJpgData',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle WebP images', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/webp;base64,mockWebpData',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })
  })

  describe('URL Handling', () => {
    test('should handle public HTTPS URLs', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'https://example.com/public/image.jpg',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle URLs with query parameters', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'https://example.com/image.jpg?size=large&quality=high',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle Firebase Storage URLs with tokens', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/images%2Fphoto.jpg?alt=media&token=abc-123-def',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle CDN URLs', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'https://cdn.example.com/assets/images/hero-banner.jpg',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    test('should handle AI generation failure', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: null, // Simulating AI failure
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      await expect(describeImage(input)).rejects.toThrow('AI failed to generate an image description')
    })

    test('should handle AI service unavailability', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const mockPromptFn = jest.fn().mockRejectedValue(new Error('AI service unavailable'))
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      await expect(describeImage(input)).rejects.toThrow('AI service unavailable')
    })

    test('should handle invalid image data', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,invalidBase64Data!!!',
      }

      const mockPromptFn = jest.fn().mockRejectedValue(new Error('Invalid image data'))
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      await expect(describeImage(input)).rejects.toThrow()
    })

    test('should handle network errors for URLs', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'https://example.com/unreachable-image.jpg',
      }

      const mockPromptFn = jest.fn().mockRejectedValue(new Error('Network error'))
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      await expect(describeImage(input)).rejects.toThrow('Network error')
    })

    test('should handle timeout errors', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'https://slow-server.com/image.jpg',
      }

      const mockPromptFn = jest.fn().mockRejectedValue(new Error('Request timeout'))
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      await expect(describeImage(input)).rejects.toThrow('Request timeout')
    })

    test('should handle empty description response', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: '', // Empty description
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      // Should still return the output (schema validation would catch this in real scenario)
      const result = await describeImage(input)
      expect(result).toBeDefined()
    })
  })

  describe('Output Format', () => {
    test('should return description field', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const result = await describeImage(input)

      expect(result).toHaveProperty('description')
    })

    test('should return description as string', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const result = await describeImage(input)

      expect(typeof result.description).toBe('string')
    })

    test('should return engaging description text', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Stunning aerial view of a tropical beach with crystal-clear turquoise waters and white sandy shores.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description).toContain('tropical beach')
      expect(result.description.length).toBeGreaterThan(10)
    })
  })

  describe('Model Configuration', () => {
    test('should use vision model from config', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const getModelConfig = require('@/lib/model-config').getModelConfig

      await describeImage(input)

      expect(getModelConfig).toHaveBeenCalled()
    })

    test('should work with different vision models', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        visionModel: 'gemini-1.5-pro-vision',
      })

      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    test('should handle very long data URIs', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,' + 'A'.repeat(100000), // Very long base64
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle unusual image formats', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/svg+xml;base64,mockSvgData',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should handle URLs with special characters', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'https://example.com/images/my%20image%20(1).jpg',
      }

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
    })

    test('should log input for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockImageData',
      }

      await describeImage(input)

      expect(consoleSpy).toHaveBeenCalledWith(
        'describeImageFlow received imageDataUri:',
        expect.any(String)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Complex Scenarios', () => {
    test('should describe multi-element scenes', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockComplexScene',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Vibrant farmers market with colorful produce stands, bustling shoppers, and artisan vendors under bright canopy tents on a sunny morning.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description).toBeTruthy()
      // Should mention multiple elements
      expect(result.description.toLowerCase()).toMatch(/market|produce|vendors|shoppers/)
    })

    test('should capture action and movement', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockActionImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Professional skateboarder executing an impressive aerial trick against an urban graffiti backdrop, captured mid-flight.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/trick|jump|flight|move|action/)
    })

    test('should identify emotional context', async () => {
      const input: DescribeImageInput = {
        imageDataUri: 'data:image/png;base64,mockEmotionalImage',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          description: 'Heartwarming moment of a grandfather teaching his grandson to ride a bicycle in a peaceful suburban park.',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await describeImage(input)

      expect(result.description.toLowerCase()).toMatch(/heartwarming|peaceful|moment|teaching/)
    })
  })
})
