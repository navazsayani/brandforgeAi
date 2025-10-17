/**
 * @jest-environment node
 */

import { editImage } from '@/ai/flows/edit-image-flow'
import type { EditImageInput } from '@/ai/flows/edit-image-flow'
import { ai } from '@/ai/genkit'
import { generateImageWithFireworks } from '@/lib/fireworks-client'

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
    imageGenerationModel: 'gemini-pro-vision',
    fireworksEnabled: false,
    fireworksSDXLTurboEnabled: false,
    fireworksSDXL3Enabled: false,
    intelligentModelSelection: false,
    fireworksSDXLTurboModel: '',
    fireworksSDXL3Model: '',
  }),
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  decodeHtmlEntitiesInUrl: jest.fn((url: string) => url),
  verifyImageUrlExists: jest.fn().mockResolvedValue(true),
}))

// Mock Fireworks client
jest.mock('@/lib/fireworks-client', () => ({
  generateImageWithFireworks: jest.fn(),
}))

// Mock fetch for URL handling
global.fetch = jest.fn()

describe('Edit Image Flow', () => {
  const mockAiGenerate = ai.generate as jest.MockedFunction<typeof ai.generate>
  const mockDefineFlow = ai.defineFlow as jest.MockedFunction<typeof ai.defineFlow>
  const mockFireworksGenerate = generateImageWithFireworks as jest.MockedFunction<typeof generateImageWithFireworks>

  const mockImageDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const mockEditedDataUri = 'data:image/png;base64,EDITED_IMAGE_DATA'

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful AI generation by default
    mockAiGenerate.mockResolvedValue({
      media: { url: mockEditedDataUri },
    } as any)

    // Mock the flow definition to return the actual implementation
    mockDefineFlow.mockImplementation((config, implementation) => {
      return implementation as any
    })

    // Mock successful Fireworks generation
    mockFireworksGenerate.mockResolvedValue([mockEditedDataUri])

    // Mock fetch for URL handling
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob([Buffer.from('mock-image-data')], { type: 'image/png' })),
    })
  })

  describe('Input Validation', () => {
    test('should accept required imageDataUri and instruction', async () => {
      const validInput: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Make the background blue',
      }

      const result = await editImage(validInput)

      expect(result).toBeDefined()
      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should reject instruction shorter than 3 characters', async () => {
      const invalidInput: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Ok', // Less than 3 characters
      }

      await expect(editImage(invalidInput)).rejects.toThrow()
    })

    test('should accept instruction with exactly 3 characters', async () => {
      const validInput: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Red', // Exactly 3 characters
      }

      const result = await editImage(validInput)

      expect(result).toBeDefined()
      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should accept all optional parameters', async () => {
      const fullInput: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Change background to sunset',
        qualityMode: 'premium',
        provider: 'GEMINI',
        fireworksImg2ImgStrength: 0.8,
        fireworksGuidanceScale: 8.0,
      }

      const result = await editImage(fullInput)

      expect(result).toBeDefined()
      expect(result.editedImageDataUri).toBeTruthy()
    })
  })

  describe('Quality Mode Selection', () => {
    test('should use fast mode with SDXL Turbo when available', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXLTurboEnabled: true,
        fireworksSDXL3Enabled: false,
        intelligentModelSelection: true,
        fireworksSDXLTurboModel: 'accounts/fireworks/models/sdxl-turbo',
        fireworksSDXL3Model: '',
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Make it brighter',
        qualityMode: 'fast',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'accounts/fireworks/models/sdxl-turbo',
          num_inference_steps: 4, // Fast mode uses fewer steps
        })
      )
    })

    test('should use premium mode with SDXL 3 when available', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXLTurboEnabled: false,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXLTurboModel: '',
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Enhance details',
        qualityMode: 'premium',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'accounts/fireworks/models/sdxl-v3',
          num_inference_steps: 25, // Premium mode uses more steps
        })
      )
    })

    test('should use balanced mode with Gemini by default', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Adjust colors',
        qualityMode: 'balanced',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalled()
      expect(result.providerUsed).toContain('Gemini')
    })

    test('should default to balanced mode when not specified', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Adjust colors',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalled()
    })
  })

  describe('Provider Selection', () => {
    test('should use Gemini when explicitly specified', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Change background',
        provider: 'GEMINI',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalled()
      expect(result.providerUsed).toContain('Gemini')
    })

    test('should use SDXL Turbo when explicitly specified and enabled', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXLTurboEnabled: true,
        intelligentModelSelection: true,
        fireworksSDXLTurboModel: 'accounts/fireworks/models/sdxl-turbo',
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Quick edit',
        provider: 'FIREWORKS_SDXL_TURBO',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalled()
    })

    test('should use SDXL 3 when explicitly specified and enabled', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'High quality edit',
        provider: 'FIREWORKS_SDXL_3',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalled()
    })

    test('should fall back to Gemini if Fireworks model not configured', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXLTurboEnabled: true,
        intelligentModelSelection: true,
        fireworksSDXLTurboModel: '', // Empty model name
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit image',
        provider: 'FIREWORKS_SDXL_TURBO',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalled()
      expect(result.providerUsed).toContain('Gemini')
    })
  })

  describe('Fireworks-Specific Parameters', () => {
    beforeEach(() => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })
    })

    test('should use custom img2img strength parameter', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Subtle changes',
        provider: 'FIREWORKS_SDXL_3',
        fireworksImg2ImgStrength: 0.5,
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 0.5,
        })
      )
    })

    test('should use custom guidance scale parameter', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Precise edits',
        provider: 'FIREWORKS_SDXL_3',
        fireworksGuidanceScale: 10.0,
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          guidance_scale: 10.0,
        })
      )
    })

    test('should use default parameters when not specified', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Standard edit',
        provider: 'FIREWORKS_SDXL_3',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 0.7, // Default balanced strength
          guidance_scale: 7.5, // Default balanced guidance
        })
      )
    })

    test('should warn when Fireworks parameters used with Gemini', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit with ignored params',
        provider: 'GEMINI',
        fireworksImg2ImgStrength: 0.8,
        fireworksGuidanceScale: 9.0,
      }

      await editImage(input)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fireworks-specific parameters')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('URL Image Handling', () => {
    test('should fetch and convert HTTPS URLs to data URIs', async () => {
      const input: EditImageInput = {
        imageDataUri: 'https://example.com/image.jpg',
        instruction: 'Edit this image',
      }

      const result = await editImage(input)

      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg')
      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should decode HTML entities in URLs', async () => {
      const decodeHtmlEntitiesInUrl = require('@/lib/utils').decodeHtmlEntitiesInUrl
      decodeHtmlEntitiesInUrl.mockReturnValue('https://example.com/image.jpg?token=abc&size=large')

      const input: EditImageInput = {
        imageDataUri: 'https://example.com/image.jpg?token=abc&amp;size=large',
        instruction: 'Edit encoded URL image',
      }

      const result = await editImage(input)

      expect(decodeHtmlEntitiesInUrl).toHaveBeenCalledWith(input.imageDataUri)
      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should verify URL exists before fetching', async () => {
      const verifyImageUrlExists = require('@/lib/utils').verifyImageUrlExists

      const input: EditImageInput = {
        imageDataUri: 'https://example.com/image.jpg',
        instruction: 'Edit verified image',
      }

      await editImage(input)

      expect(verifyImageUrlExists).toHaveBeenCalledWith(input.imageDataUri)
    })

    test('should throw error if URL image does not exist', async () => {
      const verifyImageUrlExists = require('@/lib/utils').verifyImageUrlExists
      verifyImageUrlExists.mockResolvedValue(false)

      const input: EditImageInput = {
        imageDataUri: 'https://example.com/nonexistent.jpg',
        instruction: 'Edit missing image',
      }

      await expect(editImage(input)).rejects.toThrow('Image not found or inaccessible')
    })

    test('should handle HTTP errors when fetching URLs', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const input: EditImageInput = {
        imageDataUri: 'https://example.com/404.jpg',
        instruction: 'Edit 404 image',
      }

      await expect(editImage(input)).rejects.toThrow('HTTP error')
    })

    test('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const input: EditImageInput = {
        imageDataUri: 'https://example.com/image.jpg',
        instruction: 'Edit network fail image',
      }

      await expect(editImage(input)).rejects.toThrow('Error fetching image data')
    })
  })

  describe('Prompt Construction', () => {
    test('should include user instruction in prompt', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Change the sky to sunset colors',
      }

      await editImage(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Change the sky to sunset colors'),
            }),
          ]),
        })
      )
    })

    test('should include base image in prompt', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit image',
      }

      await editImage(input)

      expect(mockAiGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.arrayContaining([
            expect.objectContaining({
              media: { url: mockImageDataUri },
            }),
          ]),
        })
      )
    })

    test('should include detailed editing instructions in prompt', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Enhance quality',
      }

      await editImage(input)

      const lastCall = mockAiGenerate.mock.calls[mockAiGenerate.mock.calls.length - 1]
      const promptText = lastCall[0].prompt.find((p: any) => p.text)?.text

      expect(promptText).toContain('photorealistic')
      expect(promptText).toContain('Expert Photo Retoucher')
    })
  })

  describe('Edit Operations', () => {
    test('should edit background colors', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Change background to white',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(result.editedImageDataUri).toMatch(/^data:image/)
    })

    test('should add objects to image', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Add a red ball in the center',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should remove objects from image', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Remove the chair from the room',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should adjust colors and lighting', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Make the image brighter and more saturated',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should apply style changes', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Apply vintage filter effect',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    test('should handle AI generation failure with Gemini', async () => {
      mockAiGenerate.mockRejectedValueOnce(new Error('AI service unavailable'))

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit image',
        provider: 'GEMINI',
      }

      await expect(editImage(input)).rejects.toThrow('AI service unavailable')
    })

    test('should handle invalid AI response', async () => {
      mockAiGenerate.mockResolvedValueOnce({
        media: null, // Invalid response
      } as any)

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit image',
        provider: 'GEMINI',
      }

      await expect(editImage(input)).rejects.toThrow('AI failed to generate a valid edited image')
    })

    test('should handle Fireworks API failure with fallback to Gemini', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      mockFireworksGenerate.mockRejectedValueOnce(new Error('Fireworks API error'))

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit with fallback',
        provider: 'FIREWORKS_SDXL_3',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockAiGenerate).toHaveBeenCalled() // Should fall back to Gemini
      expect(result.providerUsed).toContain('Gemini')
    })

    test('should handle invalid data URI format for Fireworks', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      const input: EditImageInput = {
        imageDataUri: 'invalid-data-uri',
        instruction: 'Edit with invalid URI',
        provider: 'FIREWORKS_SDXL_3',
      }

      await expect(editImage(input)).rejects.toThrow()
    })

    test('should handle empty Fireworks response', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      mockFireworksGenerate.mockResolvedValueOnce([]) // Empty array

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit with empty response',
        provider: 'FIREWORKS_SDXL_3',
      }

      // Should fall back to Gemini
      const result = await editImage(input)
      expect(result.editedImageDataUri).toBeTruthy()
    })
  })

  describe('Output Format', () => {
    test('should return edited image as data URI', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit image',
      }

      const result = await editImage(input)

      expect(result).toHaveProperty('editedImageDataUri')
      expect(result.editedImageDataUri).toMatch(/^data:image/)
    })

    test('should return provider information', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit image',
        provider: 'GEMINI',
      }

      const result = await editImage(input)

      expect(result).toHaveProperty('providerUsed')
      expect(result.providerUsed).toContain('Gemini')
    })

    test('should return correct provider name for Fireworks SDXL Turbo', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXLTurboEnabled: true,
        intelligentModelSelection: true,
        fireworksSDXLTurboModel: 'accounts/fireworks/models/sdxl-turbo',
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Quick edit',
        provider: 'FIREWORKS_SDXL_TURBO',
      }

      const result = await editImage(input)

      expect(result.providerUsed).toContain('SDXL Turbo')
    })

    test('should return correct provider name for Fireworks SDXL 3', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'High quality edit',
        provider: 'FIREWORKS_SDXL_3',
      }

      const result = await editImage(input)

      expect(result.providerUsed).toContain('SDXL 3')
    })
  })

  describe('Complex Scenarios', () => {
    test('should handle complex multi-step edits', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Change the background to a beach scene, add palm trees, and adjust lighting to sunset',
        qualityMode: 'premium',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should handle very long instructions', async () => {
      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Make the following changes: ' + 'adjust the color balance, '.repeat(20) + 'and finalize',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
    })

    test('should handle Firebase Storage URLs', async () => {
      const input: EditImageInput = {
        imageDataUri: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media&token=abc123',
        instruction: 'Edit Firebase image',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
    })
  })

  describe('Intelligent Model Selection', () => {
    test('should intelligently select model based on quality mode', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXLTurboEnabled: true,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: true,
        fireworksSDXLTurboModel: 'accounts/fireworks/models/sdxl-turbo',
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      // Fast mode should use Turbo
      const fastInput: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Quick edit',
        qualityMode: 'fast',
      }
      await editImage(fastInput)
      expect(mockFireworksGenerate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          model: 'accounts/fireworks/models/sdxl-turbo',
        })
      )

      jest.clearAllMocks()

      // Premium mode should use SDXL 3
      const premiumInput: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'High quality edit',
        qualityMode: 'premium',
      }
      await editImage(premiumInput)
      expect(mockFireworksGenerate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          model: 'accounts/fireworks/models/sdxl-v3',
        })
      )
    })

    test('should use legacy mode when intelligent selection is disabled', async () => {
      const getModelConfig = require('@/lib/model-config').getModelConfig
      getModelConfig.mockResolvedValue({
        imageGenerationModel: 'gemini-pro-vision',
        fireworksEnabled: true,
        fireworksSDXLTurboEnabled: false,
        fireworksSDXL3Enabled: true,
        intelligentModelSelection: false, // Legacy mode
        fireworksSDXL3Model: 'accounts/fireworks/models/sdxl-v3',
      })

      const input: EditImageInput = {
        imageDataUri: mockImageDataUri,
        instruction: 'Edit in legacy mode',
      }

      const result = await editImage(input)

      expect(result.editedImageDataUri).toBeTruthy()
      expect(mockFireworksGenerate).toHaveBeenCalled()
    })
  })
})
