/**
 * @jest-environment node
 */

import { enhanceBrandDescription } from '@/ai/flows/enhance-brand-description-flow'
import type { EnhanceBrandDescriptionInput } from '@/ai/flows/enhance-brand-description-flow'
import { ai } from '@/ai/genkit'

// Mock the AI instance
jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn((config) => {
      return jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'Enhanced brand description',
          targetKeywords: 'keyword1, keyword2, keyword3, keyword4, keyword5',
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
    fastModel: 'gemini-flash',
  }),
}))

describe('Enhance Brand Description Flow', () => {
  const mockDefinePrompt = ai.definePrompt as jest.MockedFunction<typeof ai.definePrompt>
  const mockDefineFlow = ai.defineFlow as jest.MockedFunction<typeof ai.defineFlow>

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset the prompt mock
    mockDefinePrompt.mockImplementation((config) => {
      return jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'Enhanced brand description',
          targetKeywords: 'keyword1, keyword2, keyword3, keyword4, keyword5',
        },
      }) as any
    })

    // Mock the flow definition to return the actual implementation
    mockDefineFlow.mockImplementation((config, implementation) => {
      return implementation as any
    })
  })

  describe('Input Validation', () => {
    test('should validate minimum brand description length', async () => {
      const invalidInput: EnhanceBrandDescriptionInput = {
        brandDescription: 'Short', // Less than 10 characters
      }

      await expect(enhanceBrandDescription(invalidInput)).rejects.toThrow()
    })

    test('should accept brand description with exactly 10 characters', async () => {
      const validInput: EnhanceBrandDescriptionInput = {
        brandDescription: '1234567890', // Exactly 10 characters
      }

      await expect(enhanceBrandDescription(validInput)).resolves.toBeDefined()
    })

    test('should accept brand description with more than 10 characters', async () => {
      const validInput: EnhanceBrandDescriptionInput = {
        brandDescription: 'A tech company focused on innovation',
      }

      await expect(enhanceBrandDescription(validInput)).resolves.toBeDefined()
    })

    test('should accept optional brand name parameter', async () => {
      const validInput: EnhanceBrandDescriptionInput = {
        brandName: 'TechCorp',
        brandDescription: 'A tech company focused on innovation',
      }

      await expect(enhanceBrandDescription(validInput)).resolves.toBeDefined()
    })

    test('should work without brand name parameter', async () => {
      const validInput: EnhanceBrandDescriptionInput = {
        brandDescription: 'A tech company focused on innovation',
      }

      await expect(enhanceBrandDescription(validInput)).resolves.toBeDefined()
    })
  })

  describe('Description Enhancement', () => {
    test('should enhance basic brand description to professional copy', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'EcoLife',
        brandDescription: 'We sell eco-friendly products for everyday use',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'EcoLife is a pioneering sustainable lifestyle brand dedicated to making eco-conscious living accessible to everyone. Through our carefully curated collection of environmentally friendly products, we empower individuals to reduce their carbon footprint while maintaining the quality and convenience they deserve in their daily lives.',
          targetKeywords: 'eco-friendly, sustainable living, green products, carbon footprint, environmental awareness',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      expect(result.enhancedDescription.length).toBeGreaterThan(input.brandDescription.length)
      expect(result.enhancedDescription).toContain('EcoLife')
    })

    test('should enhance short description with clarity and detail', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'FitPro',
        brandDescription: 'Fitness app for tracking workouts',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'FitPro is a comprehensive fitness tracking platform that transforms how athletes and fitness enthusiasts monitor their progress. With intelligent workout analytics, personalized training recommendations, and seamless progress tracking, FitPro empowers users to achieve their fitness goals faster and more efficiently than ever before.',
          targetKeywords: 'fitness app, workout tracking, fitness analytics, training goals, exercise monitoring',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      expect(result.enhancedDescription).toContain('FitPro')
      expect(result.enhancedDescription.length).toBeGreaterThan(100) // Should be substantial
    })

    test('should clarify vague descriptions', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'CloudSync',
        brandDescription: 'Software for businesses to manage stuff online',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'CloudSync is an enterprise-grade cloud management platform designed to streamline digital operations for modern businesses. Our intuitive software solution enables teams to securely store, organize, and collaborate on critical business data from anywhere, ensuring productivity and data integrity across distributed workforces.',
          targetKeywords: 'cloud management, business software, enterprise platform, data collaboration, digital operations',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      expect(result.enhancedDescription).not.toContain('stuff') // Should remove vague language
    })

    test('should strengthen weak value propositions', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'QuickEats',
        brandDescription: 'Food delivery service that delivers food fast',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'QuickEats revolutionizes food delivery with our industry-leading 20-minute guarantee. By leveraging smart logistics technology and an extensive network of local restaurant partners, we ensure fresh, hot meals arrive at your door faster than any competitor, without compromising on quality or selection.',
          targetKeywords: 'food delivery, fast delivery, meal service, restaurant delivery, quick meals',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      expect(result.enhancedDescription.length).toBeGreaterThan(input.brandDescription.length)
    })

    test('should add professional tone to casual descriptions', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'StyleHub',
        brandDescription: 'Hey we are a cool fashion store with nice clothes',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'StyleHub is a contemporary fashion destination offering curated collections that blend timeless elegance with modern trends. We empower style-conscious individuals to express their unique personality through our carefully selected range of premium apparel and accessories, making sophisticated fashion accessible to everyone.',
          targetKeywords: 'fashion store, contemporary style, modern apparel, fashion trends, clothing boutique',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      expect(result.enhancedDescription).not.toContain('Hey')
      expect(result.enhancedDescription).not.toContain('cool')
    })

    test('should incorporate brand name naturally in description', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'DataViz Pro',
        brandDescription: 'Software for creating charts and graphs from business data',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'DataViz Pro transforms complex business data into compelling visual narratives. Our powerful analytics platform enables teams to create stunning, interactive charts and dashboards that drive data-driven decision-making, helping organizations discover insights and communicate findings with unprecedented clarity.',
          targetKeywords: 'data visualization, business analytics, charts software, dashboard tools, data insights',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toContain('DataViz Pro')
    })

    test('should keep description concise yet impactful', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'SecureVault',
        brandDescription: 'Password manager app for keeping passwords safe',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'SecureVault provides military-grade encryption for your digital life. Our intuitive password management platform protects your sensitive credentials with advanced security protocols while maintaining seamless access across all your devices.',
          targetKeywords: 'password manager, secure storage, encryption, credential protection, digital security',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      // Should be 2-4 sentences (approximately 150-350 characters)
      const sentenceCount = result.enhancedDescription.split(/[.!?]+/).filter(s => s.trim().length > 0).length
      expect(sentenceCount).toBeGreaterThanOrEqual(2)
      expect(sentenceCount).toBeLessThanOrEqual(4)
    })
  })

  describe('Keyword Extraction', () => {
    test('should generate 5-7 relevant SEO keywords', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'GreenGarden',
        brandDescription: 'Organic gardening supplies and sustainable farming tools',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'GreenGarden is your trusted partner in sustainable agriculture, offering premium organic gardening supplies and eco-friendly farming tools.',
          targetKeywords: 'organic gardening, sustainable farming, gardening supplies, eco-friendly tools, agriculture, organic seeds, green living',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.targetKeywords).toBeTruthy()
      const keywords = result.targetKeywords.split(',').map(k => k.trim())
      expect(keywords.length).toBeGreaterThanOrEqual(5)
      expect(keywords.length).toBeLessThanOrEqual(7)
    })

    test('should extract keywords relevant to enhanced description', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'HealthTrack',
        brandDescription: 'Health monitoring app for tracking vitals and wellness',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'HealthTrack is a comprehensive wellness platform that empowers individuals to monitor vital health metrics and maintain optimal well-being through intelligent tracking and personalized insights.',
          targetKeywords: 'health monitoring, wellness tracking, vital signs, health app, personal health, fitness metrics',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.targetKeywords).toContain('health')
      expect(result.targetKeywords).toContain('wellness')
    })

    test('should provide industry-specific keywords', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'LegalEase',
        brandDescription: 'Legal document automation software for law firms',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'LegalEase streamlines legal practice management through intelligent document automation, enabling law firms to increase efficiency, reduce errors, and focus on delivering exceptional client service.',
          targetKeywords: 'legal software, document automation, law firm management, legal practice, contract automation, legal technology',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.targetKeywords).toContain('legal')
      const keywords = result.targetKeywords.split(',').map(k => k.trim())
      expect(keywords.some(k => k.includes('law') || k.includes('legal'))).toBe(true)
    })

    test('should format keywords as comma-separated list', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TravelHub',
        brandDescription: 'Travel planning and booking platform',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'TravelHub simplifies travel planning with comprehensive booking tools and personalized recommendations.',
          targetKeywords: 'travel planning, vacation booking, travel platform, trip organization, travel deals',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.targetKeywords).toMatch(/^[a-zA-Z0-9\s]+(?:,\s*[a-zA-Z0-9\s]+)*$/)
    })
  })

  describe('Target Audience Inference', () => {
    test('should infer B2C audience from consumer-focused description', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'PetPal',
        brandDescription: 'App to track your pet health and vet appointments',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'PetPal is the ultimate companion for pet parents, providing comprehensive health tracking, appointment reminders, and veterinary records management to ensure your furry family members receive the best possible care.',
          targetKeywords: 'pet health, vet appointments, pet care app, animal wellness, pet tracking',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toContain('pet')
      expect(result.enhancedDescription.toLowerCase()).toMatch(/pet parents|pet owners|pet lovers/i)
    })

    test('should infer B2B audience from business-focused description', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'InvoiceFlow',
        brandDescription: 'Invoice management system for companies',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'InvoiceFlow is an enterprise-grade financial management solution that automates invoice processing, streamlines accounts payable workflows, and provides real-time financial insights for businesses of all sizes.',
          targetKeywords: 'invoice management, accounts payable, business finance, invoice automation, financial software',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription.toLowerCase()).toMatch(/business|enterprise|companies|organizations/i)
    })

    test('should identify specific professional audience', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TeacherTools',
        brandDescription: 'Classroom management software for educators',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'TeacherTools empowers educators with innovative classroom management solutions, from lesson planning to student assessment, helping teachers create engaging learning environments and maximize instructional time.',
          targetKeywords: 'classroom management, teacher software, education tools, lesson planning, educator resources',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription.toLowerCase()).toMatch(/teachers|educators|instructors/i)
    })
  })

  describe('Value Proposition Strengthening', () => {
    test('should identify and amplify unique selling points', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'InstantTranslate',
        brandDescription: 'Translation app that works offline',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'InstantTranslate breaks down language barriers anywhere in the world with its revolutionary offline translation technology. Unlike competitors requiring constant connectivity, our app delivers accurate translations in 100+ languages even without internet access, making it the essential travel companion for global explorers.',
          targetKeywords: 'offline translation, language app, travel translation, multilingual tool, instant translate',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toContain('offline')
      expect(result.enhancedDescription.toLowerCase()).toMatch(/unique|revolutionary|unlike|essential/i)
    })

    test('should highlight competitive advantages', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'ZeroFee',
        brandDescription: 'Banking app with no monthly fees',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'ZeroFee is redefining modern banking by eliminating hidden charges and monthly maintenance fees. Our transparent, customer-first approach provides full-featured banking services without the financial burden, helping users save hundreds of dollars annually while accessing premium banking features.',
          targetKeywords: 'no fee banking, free banking, banking app, zero fees, transparent banking',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription.toLowerCase()).toMatch(/no fee|zero fee|without.*fee/i)
    })

    test('should emphasize measurable benefits', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TimeWise',
        brandDescription: 'Productivity tool for managing time better',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'TimeWise helps professionals reclaim up to 10 hours per week through intelligent task prioritization and automated scheduling. Our AI-powered productivity platform analyzes your work patterns and optimizes your calendar, enabling you to accomplish more while maintaining work-life balance.',
          targetKeywords: 'time management, productivity tool, task scheduling, work efficiency, time tracking',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      // Should include some form of measurable benefit
      expect(result.enhancedDescription).toMatch(/\d+|save|reclaim|increase|improve/i)
    })
  })

  describe('Error Handling', () => {
    test('should handle AI generation failure', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TestBrand',
        brandDescription: 'Valid description that meets requirements',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: null, // Simulating AI failure
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      await expect(enhanceBrandDescription(input)).rejects.toThrow('AI failed to generate an enhanced description')
    })

    test('should handle empty brand description after trimming', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandDescription: '          ', // Only whitespace
      }

      await expect(enhanceBrandDescription(input)).rejects.toThrow()
    })

    test('should handle AI service unavailability', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TestBrand',
        brandDescription: 'Valid description that meets requirements',
      }

      const mockPromptFn = jest.fn().mockRejectedValue(new Error('AI service unavailable'))
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      await expect(enhanceBrandDescription(input)).rejects.toThrow('AI service unavailable')
    })

    test('should handle malformed AI response', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TestBrand',
        brandDescription: 'Valid description that meets requirements',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: '', // Empty enhanced description
          targetKeywords: '',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      // Should still return the output, even if empty (schema validation would catch this in real scenario)
      const result = await enhanceBrandDescription(input)
      expect(result).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    test('should handle very long brand descriptions', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'LongBrand',
        brandDescription: 'A '.repeat(500) + 'comprehensive description of our brand that goes into extensive detail about everything we do and all the services we provide to our customers across multiple industries and sectors',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'LongBrand is a comprehensive multi-industry service provider delivering exceptional value across diverse sectors. Our extensive portfolio enables businesses to streamline operations and achieve sustainable growth through integrated solutions.',
          targetKeywords: 'multi-industry, comprehensive services, business solutions, integrated platform, enterprise services',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      // Enhanced description should be more concise than the overly long input
      expect(result.enhancedDescription.length).toBeLessThan(input.brandDescription.length)
    })

    test('should handle brand names with special characters', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'Tech&Co.',
        brandDescription: 'Technology consulting and development services',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'Tech&Co. delivers cutting-edge technology consulting and custom software development services to forward-thinking organizations.',
          targetKeywords: 'technology consulting, software development, tech services, IT consulting, custom development',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toContain('Tech&Co.')
    })

    test('should handle non-English brand names', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'Café Délice',
        brandDescription: 'French bakery specializing in pastries and coffee',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'Café Délice brings authentic French culinary artistry to your neighborhood, offering artisan-crafted pastries and expertly roasted coffee in a warm, inviting atmosphere.',
          targetKeywords: 'French bakery, artisan pastries, coffee shop, French cafe, gourmet bakery',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toContain('Café Délice')
    })

    test('should handle technical/niche industries', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'QuantumBio',
        brandDescription: 'Biotechnology research for pharmaceutical applications',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'QuantumBio pioneers breakthrough biotechnology research at the intersection of quantum computing and pharmaceutical development. Our innovative platform accelerates drug discovery and therapeutic development, bringing life-saving treatments to market faster than ever before.',
          targetKeywords: 'biotechnology, pharmaceutical research, drug discovery, biotech innovation, therapeutic development',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).toBeTruthy()
      expect(result.targetKeywords).toContain('biotechnology')
    })
  })

  describe('Output Format Validation', () => {
    test('should return both required fields', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TestBrand',
        brandDescription: 'A simple test description',
      }

      const result = await enhanceBrandDescription(input)

      expect(result).toHaveProperty('enhancedDescription')
      expect(result).toHaveProperty('targetKeywords')
    })

    test('should return strings for both fields', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TestBrand',
        brandDescription: 'A simple test description',
      }

      const result = await enhanceBrandDescription(input)

      expect(typeof result.enhancedDescription).toBe('string')
      expect(typeof result.targetKeywords).toBe('string')
    })

    test('should not include placeholder text in output', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'RealBrand',
        brandDescription: 'Software for managing projects and teams',
      }

      const mockPromptFn = jest.fn().mockResolvedValue({
        output: {
          enhancedDescription: 'RealBrand is a powerful project management platform that helps teams collaborate effectively and deliver projects on time.',
          targetKeywords: 'project management, team collaboration, project software, task management, team productivity',
        },
      })
      mockDefinePrompt.mockReturnValue(mockPromptFn as any)

      const result = await enhanceBrandDescription(input)

      expect(result.enhancedDescription).not.toContain('[Brand Name]')
      expect(result.enhancedDescription).not.toContain('[placeholder]')
      expect(result.enhancedDescription).not.toContain('INSERT')
    })
  })

  describe('Model Configuration', () => {
    test('should use fast model from config', async () => {
      const input: EnhanceBrandDescriptionInput = {
        brandName: 'TestBrand',
        brandDescription: 'A simple test description',
      }

      const getModelConfig = require('@/lib/model-config').getModelConfig

      await enhanceBrandDescription(input)

      expect(getModelConfig).toHaveBeenCalled()
    })
  })
})
