/**
 * @jest-environment node
 */

import { generateBrandLogo } from '@/ai/flows/generate-brand-logo-flow'
import type { GenerateBrandLogoInput } from '@/ai/flows/generate-brand-logo-flow'
import { ai } from '@/ai/genkit'

// Mock the AI instance
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
    defineFlow: jest.fn((config, implementation) => {
      return implementation as any
    }),
  },
}))

// Mock model config
jest.mock('@/lib/model-config', () => ({
  getModelConfig: jest.fn().mockResolvedValue({
    textToImageModel: 'gemini-pro-vision',
  }),
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  compressDataUriServer: jest.fn((uri: string) => uri), // Return as-is for tests
}))

// Mock GoogleGenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateImages: jest.fn(),
    },
  })),
}))

describe('Generate Brand Logo Flow', () => {
  const mockAiGenerate = ai.generate as jest.MockedFunction<typeof ai.generate>
  const mockDefineFlow = ai.defineFlow as jest.MockedFunction<typeof ai.defineFlow>

  const mockLogoDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful AI generation by default
    mockAiGenerate.mockResolvedValue({
      media: { url: mockLogoDataUri },
    } as any)

    // Mock the flow definition to return the actual implementation
    mockDefineFlow.mockImplementation((config, implementation) => {
      return implementation as any
    })
  })

  describe('Input Validation', () => {
    test('should accept required brand name and description', async () => {
      const validInput: GenerateBrandLogoInput = {
        brandName: 'TechCorp',
        brandDescription: 'A modern technology company focused on innovation',
      }

      const result = await generateBrandLogo(validInput)

      expect(result).toBeDefined()
      expect(result.logoDataUri).toBeTruthy()
    })

    test('should reject empty brand name', async () => {
      const invalidInput: GenerateBrandLogoInput = {
        brandName: '',
        brandDescription: 'A modern technology company',
      }

      await expect(generateBrandLogo(invalidInput)).rejects.toThrow()
    })

    test('should reject empty brand description', async () => {
      const invalidInput: GenerateBrandLogoInput = {
        brandName: 'TechCorp',
        brandDescription: '',
      }

      await expect(generateBrandLogo(invalidInput)).rejects.toThrow()
    })

    test('should accept all optional parameters', async () => {
      const fullInput: GenerateBrandLogoInput = {
        brandName: 'TechCorp',
        brandDescription: 'A modern technology company',
        industry: 'Technology',
        targetKeywords: 'innovation, digital, future',
        logoType: 'logotype',
        logoShape: 'circle',
        logoStyle: 'modern',
        logoColors: 'blue, silver',
        logoBackground: 'white',
      }

      const result = await generateBrandLogo(fullInput)

      expect(result).toBeDefined()
      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Logo Type Generation', () => {
    test('should generate logomark (icon-based logo)', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'TechCorp',
        brandDescription: 'A modern technology company',
        logoType: 'logomark',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      expect(result.logoDataUri).toMatch(/^data:image/)
      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('icon')
        })
      )
    })

    test('should generate logotype (text-based logo)', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'TechCorp',
        brandDescription: 'A modern technology company',
        logoType: 'logotype',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('TechCorp')
        })
      )
    })

    test('should generate monogram (initials-based logo)', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'Tech Corporation',
        brandDescription: 'A modern technology company',
        logoType: 'monogram',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('monogram')
        })
      )
    })

    test('should default to logotype when logo type not specified', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'TechCorp',
        brandDescription: 'A modern technology company',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Logo Shape Options', () => {
    const shapeTests: Array<{ shape: 'circle' | 'square' | 'shield' | 'hexagon' | 'diamond' | 'custom', description: string }> = [
      { shape: 'circle', description: 'circular' },
      { shape: 'square', description: 'square' },
      { shape: 'shield', description: 'shield' },
      { shape: 'hexagon', description: 'hexagonal' },
      { shape: 'diamond', description: 'diamond' },
      { shape: 'custom', description: 'custom' },
    ]

    shapeTests.forEach(({ shape, description }) => {
      test(`should generate logo with ${description} shape`, async () => {
        const input: GenerateBrandLogoInput = {
          brandName: 'ShapeTest',
          brandDescription: 'Testing shape variations',
          logoShape: shape,
        }

        const result = await generateBrandLogo(input)

        expect(result.logoDataUri).toBeTruthy()
      })
    })

    test('should default to custom shape when not specified', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'DefaultShape',
        brandDescription: 'Testing default shape',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Logo Style Options', () => {
    const styleTests: Array<{ style: 'minimalist' | 'modern' | 'classic' | 'playful' | 'bold' | 'elegant', keywords: string[] }> = [
      { style: 'minimalist', keywords: ['clean', 'simple', 'minimal'] },
      { style: 'modern', keywords: ['contemporary', 'sleek', 'modern'] },
      { style: 'classic', keywords: ['timeless', 'traditional', 'classic'] },
      { style: 'playful', keywords: ['friendly', 'approachable', 'playful'] },
      { style: 'bold', keywords: ['strong', 'confident', 'bold'] },
      { style: 'elegant', keywords: ['sophisticated', 'refined', 'elegant'] },
    ]

    styleTests.forEach(({ style, keywords }) => {
      test(`should generate logo with ${style} style`, async () => {
        const input: GenerateBrandLogoInput = {
          brandName: 'StyleTest',
          brandDescription: 'Testing style variations',
          logoStyle: style,
        }

        const result = await generateBrandLogo(input)

        expect(result.logoDataUri).toBeTruthy()
        // Verify style keywords are in the prompt
        const lastCall = mockAiGenerate.mock.calls[mockAiGenerate.mock.calls.length - 1]
        const prompt = lastCall[0].prompt
        const promptContainsKeyword = keywords.some(keyword =>
          prompt.toLowerCase().includes(keyword.toLowerCase())
        )
        expect(promptContainsKeyword).toBe(true)
      })
    })

    test('should default to modern style when not specified', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'DefaultStyle',
        brandDescription: 'Testing default style',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Industry-Specific Adaptations', () => {
    const industryTests = [
      { industry: 'Technology', keywords: ['tech', 'innovation', 'digital'] },
      { industry: 'Healthcare', keywords: ['health', 'wellness', 'care'] },
      { industry: 'Food & Beverage', keywords: ['food', 'fresh', 'culinary'] },
      { industry: 'Finance', keywords: ['finance', 'trust', 'security'] },
      { industry: 'Education', keywords: ['education', 'learning', 'knowledge'] },
      { industry: 'Fashion', keywords: ['fashion', 'style', 'elegant'] },
      { industry: 'Real Estate', keywords: ['real estate', 'home', 'property'] },
    ]

    industryTests.forEach(({ industry, keywords }) => {
      test(`should adapt logo design for ${industry} industry`, async () => {
        const input: GenerateBrandLogoInput = {
          brandName: `${industry}Brand`,
          brandDescription: `A company in the ${industry} industry`,
          industry: industry,
        }

        const result = await generateBrandLogo(input)

        expect(result.logoDataUri).toBeTruthy()
        // Verify industry context is in the prompt
        const lastCall = mockAiGenerate.mock.calls[mockAiGenerate.mock.calls.length - 1]
        const prompt = lastCall[0].prompt
        expect(prompt.toLowerCase()).toContain(industry.toLowerCase().split(' ')[0])
      })
    })

    test('should work without industry specification', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'GenericBrand',
        brandDescription: 'A generic company without specified industry',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Color Palette Integration', () => {
    test('should incorporate specified logo colors', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'ColorBrand',
        brandDescription: 'A brand with specific colors',
        logoColors: 'deep blue, vibrant orange',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      const lastCall = mockAiGenerate.mock.calls[mockAiGenerate.mock.calls.length - 1]
      const prompt = lastCall[0].prompt
      expect(prompt).toContain('deep blue')
      expect(prompt).toContain('orange')
    })

    test('should work without specified colors', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'NoColorBrand',
        brandDescription: 'A brand without specified colors',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })

    test('should handle complex color descriptions', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'ComplexColors',
        brandDescription: 'Brand with complex color palette',
        logoColors: 'sunset gradient from warm orange to deep purple with gold accents',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Background Options', () => {
    const backgroundTests: Array<'white' | 'transparent' | 'dark'> = ['white', 'transparent', 'dark']

    backgroundTests.forEach((background) => {
      test(`should generate logo with ${background} background`, async () => {
        const input: GenerateBrandLogoInput = {
          brandName: 'BGTest',
          brandDescription: 'Testing background options',
          logoBackground: background,
        }

        const result = await generateBrandLogo(input)

        expect(result.logoDataUri).toBeTruthy()
        const lastCall = mockAiGenerate.mock.calls[mockAiGenerate.mock.calls.length - 1]
        const prompt = lastCall[0].prompt
        expect(prompt.toLowerCase()).toContain(background.toLowerCase())
      })
    })

    test('should default to dark background when not specified', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'DefaultBG',
        brandDescription: 'Testing default background',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Keyword Integration', () => {
    test('should incorporate target keywords into design', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'KeywordBrand',
        brandDescription: 'A brand that uses keywords',
        targetKeywords: 'innovation, sustainability, community',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      const lastCall = mockAiGenerate.mock.calls[mockAiGenerate.mock.calls.length - 1]
      const prompt = lastCall[0].prompt
      expect(prompt).toContain('innovation')
    })

    test('should work without target keywords', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'NoKeywords',
        brandDescription: 'A brand without keywords',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })

  describe('Prompt Construction for Different Models', () => {
    test('should use Gemini-optimized prompt for Gemini models', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        textToImageModel: 'gemini-pro-vision',
      })

      const input: GenerateBrandLogoInput = {
        brandName: 'GeminiBrand',
        brandDescription: 'Testing Gemini prompt',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalled()
    })

    test('should use Imagen-optimized prompt for Imagen models', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        textToImageModel: 'imagen-3.0-generate-001',
      })

      const { GoogleGenAI } = require('@google/genai')
      const mockGenerateImages = jest.fn().mockResolvedValue({
        generatedImages: [{
          image: {
            imageBytes: Buffer.from('mock-image-data').toString('base64'),
          },
        }],
      })

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateImages: mockGenerateImages,
        },
      }))

      const input: GenerateBrandLogoInput = {
        brandName: 'ImagenBrand',
        brandDescription: 'Testing Imagen prompt',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      expect(mockGenerateImages).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Retries', () => {
    test('should handle AI generation failure', async () => {
      mockAiGenerate.mockRejectedValueOnce(new Error('AI service unavailable'))

      const input: GenerateBrandLogoInput = {
        brandName: 'FailTest',
        brandDescription: 'Testing failure handling',
      }

      await expect(generateBrandLogo(input)).rejects.toThrow()
    })

    test('should retry with simplified prompt if first attempt fails', async () => {
      // First call returns invalid data, second call succeeds
      mockAiGenerate
        .mockResolvedValueOnce({
          media: { url: 'invalid-data' }, // Not a valid data URI
        } as any)
        .mockResolvedValueOnce({
          media: { url: mockLogoDataUri },
        } as any)

      const input: GenerateBrandLogoInput = {
        brandName: 'RetryTest',
        brandDescription: 'Testing retry logic',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalledTimes(2)
    })

    test('should fail after multiple retry attempts', async () => {
      mockAiGenerate
        .mockResolvedValueOnce({
          media: { url: 'invalid-data-1' },
        } as any)
        .mockResolvedValueOnce({
          media: { url: 'invalid-data-2' },
        } as any)

      const input: GenerateBrandLogoInput = {
        brandName: 'MultiFailTest',
        brandDescription: 'Testing multiple failures',
      }

      await expect(generateBrandLogo(input)).rejects.toThrow('failed to generate a valid logo')
    })

    test('should handle null media response', async () => {
      mockAiGenerate.mockResolvedValueOnce({
        media: null,
      } as any)

      const input: GenerateBrandLogoInput = {
        brandName: 'NullMediaTest',
        brandDescription: 'Testing null media response',
      }

      await expect(generateBrandLogo(input)).rejects.toThrow()
    })
  })

  describe('Imagen API Specific Features', () => {
    beforeEach(() => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        textToImageModel: 'imagen-3.0-generate-001',
      })

      process.env.GOOGLE_AI_API_KEY = 'test-api-key'
    })

    test('should handle Imagen API authentication errors', async () => {
      const { GoogleGenAI } = require('@google/genai')
      const mockGenerateImages = jest.fn().mockRejectedValue({
        status: 401,
        message: 'Authentication failed',
      })

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateImages: mockGenerateImages,
        },
      }))

      const input: GenerateBrandLogoInput = {
        brandName: 'AuthTest',
        brandDescription: 'Testing auth error',
      }

      await expect(generateBrandLogo(input)).rejects.toThrow('Authentication failed')
    })

    test('should handle Imagen API model not found errors', async () => {
      const { GoogleGenAI } = require('@google/genai')
      const mockGenerateImages = jest.fn().mockRejectedValue({
        status: 404,
        message: 'Model not found',
      })

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateImages: mockGenerateImages,
        },
      }))

      const input: GenerateBrandLogoInput = {
        brandName: 'ModelTest',
        brandDescription: 'Testing model error',
      }

      await expect(generateBrandLogo(input)).rejects.toThrow('not found')
    })

    test('should handle Imagen API access denied errors', async () => {
      const { GoogleGenAI } = require('@google/genai')
      const mockGenerateImages = jest.fn().mockRejectedValue({
        status: 403,
        message: 'Access denied',
      })

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateImages: mockGenerateImages,
        },
      }))

      const input: GenerateBrandLogoInput = {
        brandName: 'AccessTest',
        brandDescription: 'Testing access error',
      }

      await expect(generateBrandLogo(input)).rejects.toThrow('Access denied')
    })

    test('should validate and clean Imagen model names', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        textToImageModel: 'googleai/imagen-3.0-generate-001', // With prefix
      })

      const { GoogleGenAI } = require('@google/genai')
      const mockGenerateImages = jest.fn().mockResolvedValue({
        generatedImages: [{
          image: {
            imageBytes: Buffer.from('mock-image-data').toString('base64'),
          },
        }],
      })

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateImages: mockGenerateImages,
        },
      }))

      const input: GenerateBrandLogoInput = {
        brandName: 'PrefixTest',
        brandDescription: 'Testing model name cleaning',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      // Should have removed the "googleai/" prefix
      expect(mockGenerateImages).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'imagen-3.0-generate-001', // Without prefix
        })
      )
    })

    test('should require API key for Imagen models', async () => {
      delete process.env.GOOGLE_AI_API_KEY
      delete process.env.GOOGLE_API_KEY

      const input: GenerateBrandLogoInput = {
        brandName: 'APIKeyTest',
        brandDescription: 'Testing API key requirement',
      }

      await expect(generateBrandLogo(input)).rejects.toThrow('API key not found')
    })
  })

  describe('Image Compression', () => {
    test('should compress large logo images', async () => {
      const compressDataUriServer = require('@/lib/utils').compressDataUriServer
      const largeMockUri = 'data:image/png;base64,' + 'A'.repeat(1000000) // Large data URI

      mockAiGenerate.mockResolvedValue({
        media: { url: largeMockUri },
      } as any)

      compressDataUriServer.mockReturnValue('data:image/png;base64,compressed')

      const input: GenerateBrandLogoInput = {
        brandName: 'CompressTest',
        brandDescription: 'Testing compression',
      }

      const result = await generateBrandLogo(input)

      expect(compressDataUriServer).toHaveBeenCalledWith(largeMockUri, 800 * 1024)
      expect(result.logoDataUri).toBe('data:image/png;base64,compressed')
    })
  })

  describe('Output Format', () => {
    test('should return logo as data URI', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'FormatTest',
        brandDescription: 'Testing output format',
      }

      const result = await generateBrandLogo(input)

      expect(result).toHaveProperty('logoDataUri')
      expect(result.logoDataUri).toMatch(/^data:image/)
    })

    test('should return valid base64 image data', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'Base64Test',
        brandDescription: 'Testing base64 format',
      }

      const result = await generateBrandLogo(input)

      // Should be a valid data URI with base64 encoding
      expect(result.logoDataUri).toMatch(/^data:image\/(png|jpeg|jpg|webp);base64,/)
    })
  })

  describe('Complex Scenarios', () => {
    test('should generate complete logo with all options specified', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'Complete Brand Co',
        brandDescription: 'A comprehensive technology company specializing in AI solutions',
        industry: 'Technology',
        targetKeywords: 'artificial intelligence, innovation, future',
        logoType: 'logomark',
        logoShape: 'hexagon',
        logoStyle: 'modern',
        logoColors: 'electric blue, silver white, deep purple',
        logoBackground: 'dark',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
      expect(result.logoDataUri).toMatch(/^data:image/)
    })

    test('should handle minimal input with defaults', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'MinimalCo',
        brandDescription: 'Simple company',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })

    test('should handle brand names with special characters', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'Tech & Co.',
        brandDescription: 'Technology consulting company',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })

    test('should handle very long brand descriptions', async () => {
      const input: GenerateBrandLogoInput = {
        brandName: 'LongDesc',
        brandDescription: 'A '.repeat(100) + 'very detailed description of our brand that goes on and on about everything we do and all our values and mission',
      }

      const result = await generateBrandLogo(input)

      expect(result.logoDataUri).toBeTruthy()
    })
  })
})
