import { 
  handleGenerateImagesAction,
  handleGenerateSocialMediaCaptionAction,
  handleGenerateBlogContentAction,
  FormState
} from '@/lib/actions'
import { generateImages } from '@/ai/flows/generate-images'
import { generateSocialMediaCaption } from '@/ai/flows/generate-social-media-caption'
import { generateBlogContent } from '@/ai/flows/generate-blog-content'

// Mock the AI flows
jest.mock('@/ai/flows/generate-images')
jest.mock('@/ai/flows/generate-social-media-caption')
jest.mock('@/ai/flows/generate-blog-content')

// Mock Firebase
jest.mock('@/lib/firebaseConfig', () => ({
  db: {},
  storage: {},
}))

// Mock Firebase functions
const mockGetDoc = jest.fn()
const mockSetDoc = jest.fn()
const mockAddDoc = jest.fn()
const mockRunTransaction = jest.fn()
const mockDoc = jest.fn()
const mockCollection = jest.fn()

jest.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  addDoc: mockAddDoc,
  collection: mockCollection,
  runTransaction: mockRunTransaction,
  serverTimestamp: () => ({ seconds: 1640995200, nanoseconds: 0 }),
}))

// Mock model config
jest.mock('@/lib/model-config', () => ({
  getModelConfig: jest.fn().mockResolvedValue({
    imageGenerationModel: 'gemini-pro-vision',
    textToImageModel: 'gemini-pro',
    fastModel: 'gemini-pro',
    visionModel: 'gemini-pro-vision',
    powerfulModel: 'gemini-pro',
  }),
}))

// Mock plans config
jest.mock('@/lib/plans-config', () => ({
  getPlansConfig: jest.fn().mockResolvedValue({
    USD: {
      free: {
        quotas: {
          imageGenerations: 5,
          socialPosts: 10,
          blogPosts: 3,
        },
      },
      pro: {
        quotas: {
          imageGenerations: 100,
          socialPosts: 200,
          blogPosts: 50,
        },
      },
    },
  }),
}))

describe('Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleGenerateImagesAction', () => {
    const mockFormData = new FormData()
    const mockPrevState: FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string }> = {}

    beforeEach(() => {
      mockFormData.set('userId', 'test-user-123')
      mockFormData.set('brandDescription', 'A modern tech company')
      mockFormData.set('imageStyle', 'professional')
      mockFormData.set('numberOfImages', '1')
    })

    test('should generate images successfully for authenticated user', async () => {
      // Mock user profile exists
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'test@example.com',
        }),
      })

      // Mock usage document
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ imageGenerations: 2 }),
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
      })

      // Mock AI generation
      ;(generateImages as jest.Mock).mockResolvedValueOnce({
        generatedImages: ['data:image/png;base64,mockimage'],
        promptUsed: 'A professional image for a modern tech company',
        providerUsed: 'GEMINI',
      })

      const result = await handleGenerateImagesAction(mockPrevState, mockFormData)

      expect(result.data).toBeDefined()
      expect(result.data?.generatedImages).toHaveLength(1)
      expect(result.data?.providerUsed).toBe('GEMINI')
      expect(result.message).toContain('1 image(s)/task(s) processed')
    })

    test('should reject unauthenticated requests', async () => {
      const formDataWithoutUser = new FormData()
      formDataWithoutUser.set('brandDescription', 'A modern tech company')

      const result = await handleGenerateImagesAction(mockPrevState, formDataWithoutUser)

      expect(result.error).toBe('User not authenticated. Cannot generate images.')
      expect(result.data).toBeUndefined()
    })

    test('should enforce usage quotas for free users', async () => {
      // Mock user profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'test@example.com',
        }),
      })

      // Mock usage at limit
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ imageGenerations: 5 }), // At free limit
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
        throw new Error('You have reached your monthly quota of 5 for image generations')
      })

      const result = await handleGenerateImagesAction(mockPrevState, mockFormData)

      expect(result.error).toContain('You have reached your monthly quota')
    })

    test('should allow admin users to bypass quotas', async () => {
      mockFormData.set('userId', 'admin-user')

      // Mock admin user profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'admin@brandforge.ai',
        }),
      })

      // Mock AI generation
      ;(generateImages as jest.Mock).mockResolvedValueOnce({
        generatedImages: ['data:image/png;base64,mockimage'],
        promptUsed: 'Admin generated image',
        providerUsed: 'GEMINI',
      })

      const result = await handleGenerateImagesAction(mockPrevState, mockFormData)

      expect(result.data).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    test('should handle multiple image generation for premium users', async () => {
      mockFormData.set('numberOfImages', '3')

      // Mock premium user
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'premium',
          userEmail: 'premium@example.com',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      })

      // Mock usage check for each image
      mockRunTransaction
        .mockImplementationOnce(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => ({ imageGenerations: 10 }),
            }),
            set: jest.fn(),
          }
          await callback(mockTransaction)
        })
        .mockImplementationOnce(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => ({ imageGenerations: 11 }),
            }),
            set: jest.fn(),
          }
          await callback(mockTransaction)
        })
        .mockImplementationOnce(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => ({ imageGenerations: 12 }),
            }),
            set: jest.fn(),
          }
          await callback(mockTransaction)
        })

      // Mock AI generation
      ;(generateImages as jest.Mock).mockResolvedValueOnce({
        generatedImages: [
          'data:image/png;base64,mockimage1',
          'data:image/png;base64,mockimage2',
          'data:image/png;base64,mockimage3',
        ],
        promptUsed: 'Premium batch generation',
        providerUsed: 'GEMINI',
      })

      const result = await handleGenerateImagesAction(mockPrevState, mockFormData)

      expect(result.data?.generatedImages).toHaveLength(3)
      expect(result.message).toContain('3 image(s)/task(s) processed')
    })

    test('should restrict multiple images for free users', async () => {
      mockFormData.set('numberOfImages', '2')

      // Mock free user
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'free@example.com',
        }),
      })

      const result = await handleGenerateImagesAction(mockPrevState, mockFormData)

      expect(result.error).toBe('Generating multiple images at once is a premium feature. Please upgrade your plan.')
    })

    test('should handle AI generation errors gracefully', async () => {
      // Mock user profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'test@example.com',
        }),
      })

      // Mock usage check
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ imageGenerations: 1 }),
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
      })

      // Mock AI generation failure
      ;(generateImages as jest.Mock).mockRejectedValueOnce(new Error('AI service unavailable'))

      const result = await handleGenerateImagesAction(mockPrevState, mockFormData)

      expect(result.error).toContain('Failed to generate image(s): AI service unavailable')
    })
  })

  describe('handleGenerateSocialMediaCaptionAction', () => {
    const mockFormData = new FormData()
    const mockPrevState: FormState<{ caption: string; hashtags: string; imageSrc: string | null }> = {}

    beforeEach(() => {
      mockFormData.set('userId', 'test-user-123')
      mockFormData.set('userEmail', 'test@example.com')
      mockFormData.set('brandDescription', 'A modern tech company')
      mockFormData.set('tone', 'professional')
    })

    test('should generate social media caption successfully', async () => {
      // Mock user profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'test@example.com',
        }),
      })

      // Mock usage check
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ socialPosts: 5 }),
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
      })

      // Mock AI generation
      ;(generateSocialMediaCaption as jest.Mock).mockResolvedValueOnce({
        caption: 'Exciting tech innovations coming your way! 🚀',
        hashtags: '#tech #innovation #startup #technology #future',
      })

      // Mock Firestore save
      mockAddDoc.mockResolvedValueOnce({ id: 'mock-doc-id' })

      const result = await handleGenerateSocialMediaCaptionAction(mockPrevState, mockFormData)

      expect(result.data).toBeDefined()
      expect(result.data?.caption).toContain('Exciting tech innovations')
      expect(result.data?.hashtags).toContain('#tech')
      expect(result.message).toBe('Social media content generated and saved successfully!')
    })

    test('should handle image-based social posts', async () => {
      mockFormData.set('selectedImageSrcForSocialPost', 'https://example.com/image.jpg')
      mockFormData.set('socialImageDescription', 'A modern office workspace')

      // Mock user profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'premium',
          userEmail: 'test@example.com',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      })

      // Mock usage check
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ socialPosts: 15 }),
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
      })

      // Mock AI generation
      ;(generateSocialMediaCaption as jest.Mock).mockResolvedValueOnce({
        caption: 'Check out our amazing workspace! Perfect for productivity and creativity.',
        hashtags: '#workspace #office #productivity #design #modern',
      })

      mockAddDoc.mockResolvedValueOnce({ id: 'mock-doc-id' })

      const result = await handleGenerateSocialMediaCaptionAction(mockPrevState, mockFormData)

      expect(result.data?.imageSrc).toBe('https://example.com/image.jpg')
      expect(result.data?.caption).toContain('workspace')
    })

    test('should require image description when image is provided', async () => {
      mockFormData.set('selectedImageSrcForSocialPost', 'https://example.com/image.jpg')
      // No image description provided

      const result = await handleGenerateSocialMediaCaptionAction(mockPrevState, mockFormData)

      expect(result.error).toBe('Image description is required if an image is selected for the post.')
    })

    test('should enforce social post quotas', async () => {
      // Mock user profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'test@example.com',
        }),
      })

      // Mock usage at limit
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ socialPosts: 10 }), // At free limit
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
        throw new Error('You have reached your monthly quota of 10 for social posts')
      })

      const result = await handleGenerateSocialMediaCaptionAction(mockPrevState, mockFormData)

      expect(result.error).toContain('You have reached your monthly quota')
    })
  })

  describe('handleGenerateBlogContentAction', () => {
    const mockFormData = new FormData()
    const mockPrevState: FormState<{ title: string; content: string; tags: string }> = {}

    beforeEach(() => {
      mockFormData.set('userId', 'test-user-123')
      mockFormData.set('userEmail', 'test@example.com')
      mockFormData.set('brandName', 'TechCorp')
      mockFormData.set('blogBrandDescription', 'A leading technology company')
      mockFormData.set('blogKeywords', 'technology, innovation, AI')
      mockFormData.set('targetPlatform', 'Medium')
      mockFormData.set('blogOutline', '1. Introduction\n2. Main Content\n3. Conclusion')
      mockFormData.set('blogTone', 'informative')
    })

    test('should generate blog content successfully', async () => {
      // Mock user profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'premium',
          userEmail: 'test@example.com',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      })

      // Mock usage check
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ blogPosts: 5 }),
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
      })

      // Mock AI generation
      ;(generateBlogContent as jest.Mock).mockResolvedValueOnce({
        title: 'The Future of AI in Technology',
        content: '# The Future of AI in Technology\n\nArtificial Intelligence is transforming...',
        tags: 'AI, technology, innovation, future, automation',
      })

      mockAddDoc.mockResolvedValueOnce({ id: 'mock-blog-id' })

      const result = await handleGenerateBlogContentAction(mockPrevState, mockFormData)

      expect(result.data).toBeDefined()
      expect(result.data?.title).toBe('The Future of AI in Technology')
      expect(result.data?.content).toContain('Artificial Intelligence')
      expect(result.data?.tags).toContain('AI')
      expect(result.message).toBe('Blog content generated and saved successfully!')
    })

    test('should require all mandatory fields', async () => {
      const incompleteFormData = new FormData()
      incompleteFormData.set('userId', 'test-user-123')
      incompleteFormData.set('brandName', 'TechCorp')
      // Missing other required fields

      const result = await handleGenerateBlogContentAction(mockPrevState, incompleteFormData)

      expect(result.error).toContain('All fields')
    })

    test('should enforce blog post quotas for free users', async () => {
      // Mock free user
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'free',
          userEmail: 'test@example.com',
        }),
      })

      // Mock usage at limit
      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ blogPosts: 3 }), // At free limit
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
        throw new Error('You have reached your monthly quota of 3 for blog posts')
      })

      const result = await handleGenerateBlogContentAction(mockPrevState, mockFormData)

      expect(result.error).toContain('You have reached your monthly quota')
    })

    test('should save blog content with all metadata', async () => {
      mockFormData.set('industry', 'Technology')
      mockFormData.set('blogWebsiteUrl', 'https://techcorp.com')
      mockFormData.set('articleStyle', 'How-To Guide')
      mockFormData.set('targetAudience', 'Developers')

      // Mock premium user
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          plan: 'premium',
          userEmail: 'test@example.com',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      })

      mockRunTransaction.mockImplementationOnce(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ blogPosts: 2 }),
          }),
          set: jest.fn(),
        }
        await callback(mockTransaction)
      })

      ;(generateBlogContent as jest.Mock).mockResolvedValueOnce({
        title: 'How to Build AI Applications',
        content: '# How to Build AI Applications\n\nStep-by-step guide...',
        tags: 'AI, development, tutorial, programming',
      })

      mockAddDoc.mockResolvedValueOnce({ id: 'mock-blog-id' })

      const result = await handleGenerateBlogContentAction(mockPrevState, mockFormData)

      expect(result.data).toBeDefined()
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'How to Build AI Applications',
          content: expect.stringContaining('Step-by-step guide'),
          tags: expect.stringContaining('AI'),
          platform: 'Medium',
          blogTone: 'informative',
          industry: 'Technology',
          websiteUrl: 'https://techcorp.com',
          articleStyle: 'How-To Guide',
          targetAudience: 'Developers',
          status: 'draft',
        })
      )
    })
  })
})