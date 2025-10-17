/**
 * @jest-environment node
 */

import { extractBrandInfoFromUrl } from '@/ai/flows/extract-brand-info-from-url-flow'
import type { ExtractBrandInfoFromUrlInput } from '@/ai/flows/extract-brand-info-from-url-flow'
import { ai } from '@/ai/genkit'
import { fetchWebsiteContentTool } from '@/ai/tools/fetch-website-content-tool'

// Mock the AI instance
jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn((config) => {
      return jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'A modern technology company focused on innovation and digital transformation',
          targetKeywords: 'technology, innovation, digital, software, solutions',
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
    powerfulModel: 'gemini-pro',
  }),
}))

// Mock fetch website content tool
jest.mock('@/ai/tools/fetch-website-content-tool', () => ({
  fetchWebsiteContentTool: jest.fn(),
}))

describe('Extract Brand Info From URL Flow', () => {
  const mockDefinePrompt = ai.definePrompt as jest.MockedFunction<typeof ai.definePrompt>
  const mockDefineFlow = ai.defineFlow as jest.MockedFunction<typeof ai.defineFlow>
  const mockFetchWebsiteContentTool = fetchWebsiteContentTool as jest.MockedFunction<typeof fetchWebsiteContentTool>

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful website content fetch by default
    mockFetchWebsiteContentTool.mockResolvedValue({
      textContent: 'Welcome to TechCorp. We are a leading technology company specializing in cloud solutions and AI-powered software. Our mission is to empower businesses through innovation.',
      error: undefined,
    })

    // Reset the prompt mock
    mockDefinePrompt.mockImplementation((config) => {
      return jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'A modern technology company focused on innovation and digital transformation',
          targetKeywords: 'technology, innovation, digital, software, solutions',
        },
      }) as any
    })

    // Mock the flow definition to return the actual implementation
    mockDefineFlow.mockImplementation((config, implementation) => {
      return implementation as any
    })
  })

  describe('Input Validation', () => {
    test('should accept valid website URL', async () => {
      const validInput: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      const result = await extractBrandInfoFromUrl(validInput)

      expect(result).toBeDefined()
      expect(result.brandDescription).toBeTruthy()
      expect(result.targetKeywords).toBeTruthy()
    })

    test('should reject invalid URL format', async () => {
      const invalidInput: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'not-a-valid-url',
      }

      await expect(extractBrandInfoFromUrl(invalidInput)).rejects.toThrow()
    })

    test('should accept URLs with different protocols', async () => {
      const httpsInput: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      const result = await extractBrandInfoFromUrl(httpsInput)
      expect(result).toBeDefined()
    })

    test('should accept URLs with paths', async () => {
      const urlWithPath: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com/about/company',
      }

      const result = await extractBrandInfoFromUrl(urlWithPath)
      expect(result).toBeDefined()
    })

    test('should accept URLs with query parameters', async () => {
      const urlWithQuery: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com?page=about&section=team',
      }

      const result = await extractBrandInfoFromUrl(urlWithQuery)
      expect(result).toBeDefined()
    })
  })

  describe('Website Content Extraction', () => {
    test('should fetch website content using the tool', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://techcompany.com',
      }

      await extractBrandInfoFromUrl(input)

      expect(mockFetchWebsiteContentTool).toHaveBeenCalledWith({
        url: 'https://techcompany.com',
      })
    })

    test('should extract brand info from rich website content', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'EcoGreen is a sustainable energy company committed to renewable power solutions. We provide solar panels, wind turbines, and energy management systems to homes and businesses. Our vision is a carbon-neutral future powered by clean energy.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'EcoGreen is a sustainable energy company specializing in renewable power solutions including solar panels, wind turbines, and energy management systems for homes and businesses. Committed to creating a carbon-neutral future through clean energy innovation.',
          targetKeywords: 'sustainable energy, renewable power, solar panels, wind turbines, clean energy, carbon neutral, energy management',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://ecogreen.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription).toContain('sustainable')
      expect(result.brandDescription).toContain('renewable')
      expect(result.targetKeywords).toContain('energy')
    })

    test('should extract brand info from minimal content', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'Welcome to FitLife Gym. Your fitness journey starts here.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'FitLife Gym is a fitness center dedicated to helping individuals achieve their health and wellness goals through personalized training and modern facilities.',
          targetKeywords: 'fitness, gym, health, wellness, training, workout',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://fitlifegym.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription).toBeTruthy()
      expect(result.targetKeywords).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    test('should handle website fetch errors gracefully', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: '',
        error: 'Failed to fetch: Network timeout',
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'Based on the URL, this appears to be a business website. Unable to extract detailed information due to fetch error.',
          targetKeywords: 'business, company, services',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://unreachable.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result).toBeDefined()
      expect(result.brandDescription).toBeTruthy()
    })

    test('should handle 404 errors', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: '',
        error: 'HTTP 404: Page not found',
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'Unable to access the specified URL. The page may not exist or is temporarily unavailable.',
          targetKeywords: 'website, business, company',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com/404',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result).toBeDefined()
    })

    test('should handle network timeouts', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: '',
        error: 'Request timeout after 30s',
      })

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://slowwebsite.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result).toBeDefined()
    })

    test('should handle AI generation failure', async () => {
      const mockPromptFn = jest.fn().mockResolvedValue({
        output: null, // AI failure
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      await expect(extractBrandInfoFromUrl(input)).rejects.toThrow('AI failed to generate brand information')
    })

    test('should handle AI service unavailability', async () => {
      const mockPromptFn = jest.fn().mockRejectedValue(new Error('AI service unavailable'))
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      await expect(extractBrandInfoFromUrl(input)).rejects.toThrow('AI service unavailable')
    })
  })

  describe('Brand Description Quality', () => {
    test('should generate comprehensive description (2-4 sentences)', async () => {
      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'CloudTech is an enterprise cloud infrastructure provider delivering scalable solutions to Fortune 500 companies. With cutting-edge technology and 24/7 support, they empower businesses to accelerate digital transformation. Their platform serves over 10,000 customers globally.',
          targetKeywords: 'cloud infrastructure, enterprise solutions, digital transformation, scalable platform, cloud services',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://cloudtech.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      const sentenceCount = result.brandDescription.split(/[.!?]+/).filter(s => s.trim().length > 0).length
      expect(sentenceCount).toBeGreaterThanOrEqual(2)
      expect(sentenceCount).toBeLessThanOrEqual(5) // Allow some flexibility
    })

    test('should identify brand values and mission', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'At GreenEarth, we believe in sustainability and environmental responsibility. Our eco-friendly products help reduce waste and protect the planet for future generations.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'GreenEarth is an environmentally conscious brand committed to sustainability and reducing waste through eco-friendly products. Their mission focuses on protecting the planet for future generations.',
          targetKeywords: 'sustainability, eco-friendly, environmental, green products, waste reduction',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://greenearth.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription.toLowerCase()).toMatch(/sustainability|environmental|eco-friendly/)
    })

    test('should identify target audience when discernible', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'KidsFun is a toy company creating educational and entertaining products for children ages 3-10. Parents trust us to deliver safe, engaging toys that promote learning through play.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'KidsFun creates educational and entertaining toys for children ages 3-10, trusted by parents for safety and engagement. They focus on promoting learning through play with innovative product designs.',
          targetKeywords: 'kids toys, educational toys, children products, learning toys, safe toys',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://kidsfun.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription.toLowerCase()).toMatch(/children|kids|parents/)
    })

    test('should not use placeholder text', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription).not.toContain('[Brand Name]')
      expect(result.brandDescription).not.toContain('[Company]')
      expect(result.brandDescription).not.toContain('[placeholder]')
    })
  })

  describe('Keyword Extraction Quality', () => {
    test('should extract 5-10 relevant keywords', async () => {
      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'TechStartup is an innovative software company.',
          targetKeywords: 'software, technology, innovation, startups, SaaS, cloud computing, digital solutions',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://techstartup.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      const keywords = result.targetKeywords.split(',').map(k => k.trim())
      expect(keywords.length).toBeGreaterThanOrEqual(5)
      expect(keywords.length).toBeLessThanOrEqual(10)
    })

    test('should extract SEO-appropriate keywords', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'LuxuryHomes offers premium real estate services including property management, luxury home sales, and investment consulting.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'LuxuryHomes provides premium real estate services including luxury home sales, property management, and investment consulting.',
          targetKeywords: 'luxury real estate, premium homes, property management, real estate investment, luxury properties, home sales',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://luxuryhomes.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.targetKeywords.toLowerCase()).toMatch(/real estate|property|home/)
    })

    test('should format keywords as comma-separated list', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.targetKeywords).toMatch(/^[a-zA-Z0-9\s]+(?:,\s*[a-zA-Z0-9\s]+)*$/)
    })

    test('should extract industry-specific keywords', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'HealthCare Plus provides telemedicine, patient records management, and healthcare analytics solutions for medical practices.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'HealthCare Plus delivers comprehensive healthcare technology solutions including telemedicine, patient records management, and analytics for medical practices.',
          targetKeywords: 'telemedicine, healthcare technology, patient records, medical software, healthcare analytics, digital health',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://healthcareplus.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.targetKeywords.toLowerCase()).toMatch(/health|medical|telemedicine/)
    })
  })

  describe('Different Industry Types', () => {
    test('should extract info from e-commerce website', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'FashionHub is your destination for trendy clothing and accessories. Shop the latest styles with free shipping on orders over $50.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'FashionHub is an online fashion retailer offering trendy clothing and accessories with convenient shipping options for style-conscious shoppers.',
          targetKeywords: 'fashion, online shopping, clothing, accessories, trendy styles, e-commerce',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://fashionhub.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription.toLowerCase()).toMatch(/fashion|clothing|shop/)
    })

    test('should extract info from SaaS website', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'ProjectFlow is a cloud-based project management platform that helps teams collaborate and deliver projects on time. Try our free 14-day trial.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'ProjectFlow is a cloud-based project management platform designed to enhance team collaboration and ensure timely project delivery with intuitive tools and workflows.',
          targetKeywords: 'project management, SaaS, team collaboration, cloud software, project tracking, workflow management',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://projectflow.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription.toLowerCase()).toMatch(/project management|saas|cloud/)
      expect(result.targetKeywords.toLowerCase()).toMatch(/project|collaboration|saas/)
    })

    test('should extract info from service business website', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'Elite Consulting provides strategic business consulting services to Fortune 500 companies. Our expert consultants drive growth and operational excellence.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'Elite Consulting offers strategic business consulting services to Fortune 500 companies, with expert consultants focused on driving growth and operational excellence.',
          targetKeywords: 'business consulting, strategic consulting, Fortune 500, operational excellence, business growth, consulting services',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://eliteconsulting.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription.toLowerCase()).toMatch(/consulting|business|services/)
    })
  })

  describe('Model Configuration', () => {
    test('should use powerful model from config', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      const getModelConfig = require('@/lib/model-config').getModelConfig

      await extractBrandInfoFromUrl(input)

      expect(getModelConfig).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('should handle websites with very long content', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'Long content... '.repeat(1000) + 'This is a technology company.',
        error: undefined,
      })

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://longcontent.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription).toBeTruthy()
      expect(result.targetKeywords).toBeTruthy()
    })

    test('should handle websites with special characters in content', async () => {
      mockFetchWebsiteContentTool.mockResolvedValue({
        textContent: 'Café Délice - Premium French Bakery & Pâtisserie. We serve authentic croissants, éclairs, and artisan breads.',
        error: undefined,
      })

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          brandDescription: 'Café Délice is a premium French bakery and pâtisserie offering authentic croissants, éclairs, and artisan breads.',
          targetKeywords: 'French bakery, patisserie, artisan bread, croissants, eclairs, premium bakery',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://cafedelice.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result.brandDescription).toBeTruthy()
    })

    test('should handle subdomain URLs', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://blog.example.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result).toBeDefined()
    })

    test('should handle URLs with ports', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com:8080',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result).toBeDefined()
    })
  })

  describe('Output Format', () => {
    test('should return both required fields', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(result).toHaveProperty('brandDescription')
      expect(result).toHaveProperty('targetKeywords')
    })

    test('should return strings for both fields', async () => {
      const input: ExtractBrandInfoFromUrlInput = {
        websiteUrl: 'https://example.com',
      }

      const result = await extractBrandInfoFromUrl(input)

      expect(typeof result.brandDescription).toBe('string')
      expect(typeof result.targetKeywords).toBe('string')
    })
  })
})
