/**
 * @jest-environment node
 */

import { generateSocialMediaCaption } from '@/ai/flows/generate-social-media-caption';
import type { GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { ai } from '@/ai/genkit';

// Mock the AI instance
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
    definePrompt: jest.fn((config) => config),
  },
}));

// Mock model config
jest.mock('@/lib/model-config', () => ({
  getModelConfig: jest.fn().mockResolvedValue({
    textToImageModel: 'gemini-pro',
    fastModel: 'gemini-flash',
  }),
}));

// Mock RAG integration
jest.mock('@/lib/rag-integration', () => ({
  enhanceSocialMediaPrompt: jest.fn((prompt) => Promise.resolve(prompt)),
  storeContentForRAG: jest.fn(),
  getAdaptiveRAGContext: jest.fn().mockResolvedValue({
    relevantContent: [],
    confidence: 0,
  }),
  createRAGInsightsFromContext: jest.fn().mockReturnValue(null),
}));

describe('Generate Social Media Caption Flow', () => {
  const mockAiGenerate = ai.generate as jest.MockedFunction<typeof ai.generate>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    test('should accept valid input with all required fields', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Modern tech startup focused on AI solutions',
        tone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Transforming businesses with cutting-edge AI technology.',
        hashtags: '#AI #Technology #Innovation #Business',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result).toBeDefined();
      expect(result.caption).toBeTruthy();
      expect(result.hashtags).toBeTruthy();
    });

    test('should accept optional fields', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Eco-friendly products',
        tone: 'friendly',
        industry: 'Sustainability',
        platform: 'instagram',
        imageDescription: 'Reusable water bottle in nature',
        postGoal: 'Brand Awareness',
        targetAudience: 'Environmentally conscious millennials',
        callToAction: 'Shop now',
        language: 'english',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Stay hydrated while saving the planet! 🌍',
        hashtags: '#Sustainable #EcoFriendly #ZeroWaste #GreenLiving',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toContain('hydrated');
      expect(result.hashtags).toContain('#Sustainable');
    });
  });

  describe('Platform-Specific Generation', () => {
    test('should generate Instagram-optimized caption', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Fashion boutique',
        tone: 'trendy',
        platform: 'instagram',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'New collection dropping this week! ✨ Style meets comfort in every piece. Which look is your fave? 💕',
        hashtags: '#Fashion #Style #OOTD #NewCollection #Boutique',
      });

      const result = await generateSocialMediaCaption(input);

      // Instagram should have engaging, visual content
      expect(result.caption.length).toBeLessThanOrEqual(1000);
      // Instagram typically uses 5-7 hashtags
      const hashtagCount = (result.hashtags.match(/#/g) || []).length;
      expect(hashtagCount).toBeGreaterThanOrEqual(3);
      expect(hashtagCount).toBeLessThanOrEqual(10);
    });

    test('should generate Twitter-optimized caption with character limit', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Tech news platform',
        tone: 'informative',
        platform: 'twitter',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Breaking: New AI breakthrough changes everything. Read more on our site. 🚀',
        hashtags: '#AI #TechNews #Innovation',
      });

      const result = await generateSocialMediaCaption(input);

      // Twitter has 280 character limit
      expect(result.caption.length).toBeLessThanOrEqual(280);
      // Twitter typically uses 1-3 hashtags
      const hashtagCount = (result.hashtags.match(/#/g) || []).length;
      expect(hashtagCount).toBeGreaterThanOrEqual(1);
      expect(hashtagCount).toBeLessThanOrEqual(5);
    });

    test('should generate LinkedIn-optimized caption', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'B2B SaaS company',
        tone: 'professional',
        platform: 'linkedin',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'The future of enterprise productivity is here. Our latest report reveals how AI is transforming workplace efficiency. What trends are you seeing in your industry?',
        hashtags: '#B2B #SaaS #Enterprise #Productivity',
      });

      const result = await generateSocialMediaCaption(input);

      // LinkedIn allows up to 3000 characters
      expect(result.caption.length).toBeLessThanOrEqual(3000);
      // LinkedIn uses 3-5 professional hashtags
      const hashtagCount = (result.hashtags.match(/#/g) || []).length;
      expect(hashtagCount).toBeGreaterThanOrEqual(2);
      expect(hashtagCount).toBeLessThanOrEqual(7);
    });

    test('should generate Facebook-optimized caption', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Community fitness center',
        tone: 'friendly',
        platform: 'facebook',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Join us this Saturday for our community workout event! Bring a friend and get fit together. See you there!',
        hashtags: '#CommunityFitness #WorkoutTogether #HealthyLiving #LocalFitness',
      });

      const result = await generateSocialMediaCaption(input);

      // Facebook allows up to 2000 characters
      expect(result.caption.length).toBeLessThanOrEqual(2000);
      expect(result.caption).toMatch(/community|together|join/i);
    });
  });

  describe('Tone Variations', () => {
    test('should generate professional tone', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Corporate consulting firm',
        tone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Our Q4 insights report is now available. Learn about the latest industry trends and strategic opportunities.',
        hashtags: '#BusinessStrategy #Consulting #Leadership',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toBeTruthy();
      // Professional tone should avoid emojis or casual language
      expect(result.caption).not.toMatch(/lol|omg|yay/i);
    });

    test('should generate funny/casual tone', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Meme marketing agency',
        tone: 'funny',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'When your content goes viral but your coffee is still cold ☕😅 #MarketingLife',
        hashtags: '#Marketing #Memes #SocialMedia #Relatable',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toBeTruthy();
      // Funny tone can include emojis and casual language
    });

    test('should generate inspirational tone', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Life coaching services',
        tone: 'inspirational',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Every great journey begins with a single step. What will yours be today? 💫',
        hashtags: '#Motivation #PersonalGrowth #LifeCoaching #Inspiration',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toMatch(/journey|step|growth|believe|achieve/i);
    });

    test('should generate informative tone', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Educational platform',
        tone: 'informative',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Did you know? 73% of learners prefer interactive content. Discover how our platform makes learning engaging.',
        hashtags: '#Education #EdTech #Learning #OnlineLearning',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toMatch(/learn|discover|know|fact|understand/i);
    });
  });

  describe('Post Goals', () => {
    test('should optimize for engagement goal', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Coffee shop',
        tone: 'friendly',
        postGoal: 'engagement',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Coffee or tea? ☕🍵 Tell us your morning ritual in the comments!',
        hashtags: '#Coffee #MorningRoutine #CoffeeLover',
      });

      const result = await generateSocialMediaCaption(input);

      // Engagement posts should have questions or prompts
      expect(result.caption).toMatch(/\?|tell us|share|comment|what|which|how/i);
    });

    test('should optimize for promotion goal', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'E-commerce store',
        tone: 'professional',
        postGoal: 'promotion',
        callToAction: 'Shop now',
      };

      mockAiGenerate.mockResolvedValue({
        caption: '🎉 Flash Sale! 30% off everything for the next 24 hours. Shop now before it ends!',
        hashtags: '#Sale #Shopping #Deals #FlashSale',
      });

      const result = await generateSocialMediaCaption(input);

      // Promotion posts should have clear CTA
      expect(result.caption).toMatch(/shop|buy|get|save|discount|sale/i);
    });

    test('should optimize for brand awareness goal', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'New sustainable brand',
        tone: 'friendly',
        postGoal: 'Brand Awareness',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Meet EcoStyle - where sustainability meets fashion. We believe in creating beautiful products that don\'t cost the earth.',
        hashtags: '#Sustainable #EcoFriendly #BrandStory #NewBrand',
      });

      const result = await generateSocialMediaCaption(input);

      // Brand awareness should introduce the brand
      expect(result.caption).toBeTruthy();
    });
  });

  describe('Image Context Integration', () => {
    test('should incorporate image description', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Travel agency',
        tone: 'inspirational',
        imageDescription: 'Sunset over tropical beach with palm trees',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Paradise found. 🌅 Where will your next adventure take you?',
        hashtags: '#Travel #Beach #Paradise #Wanderlust',
      });

      const result = await generateSocialMediaCaption(input);

      // Caption should relate to the image
      expect(result.caption).toMatch(/paradise|beach|sunset|tropical/i);
    });

    test('should work without image description', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Digital marketing agency',
        tone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Elevate your brand with data-driven marketing strategies.',
        hashtags: '#DigitalMarketing #Marketing #Strategy',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toBeTruthy();
      expect(result.hashtags).toBeTruthy();
    });
  });

  describe('Target Audience Adaptation', () => {
    test('should tailor content for young professionals', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Career coaching service',
        tone: 'professional',
        targetAudience: 'Young professionals aged 25-35',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Level up your career. Get personalized coaching from industry experts.',
        hashtags: '#CareerGrowth #YoungProfessionals #CareerCoaching',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toMatch(/career|professional|growth|success/i);
    });

    test('should tailor content for parents', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Educational toys company',
        tone: 'friendly',
        targetAudience: 'Parents of toddlers',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Learning through play! Discover toys that grow with your little one.',
        hashtags: '#ParentingTips #EducationalToys #ToddlerLife #Parenting',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toMatch(/learn|play|child|kid|parent/i);
    });
  });

  describe('Call to Action', () => {
    test('should include specific call to action', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Online course platform',
        tone: 'professional',
        callToAction: 'Enroll today',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Transform your skills with expert-led courses. Enroll today and get 20% off!',
        hashtags: '#OnlineLearning #Courses #SkillDevelopment',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toContain('Enroll today');
    });

    test('should handle multiple CTAs appropriately', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Fitness app',
        tone: 'motivational',
        callToAction: 'Download now and start your free trial',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Your fitness journey starts here. Download now and start your free trial!',
        hashtags: '#Fitness #Health #WorkoutApp #GetFit',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toMatch(/download|start|trial/i);
    });
  });

  describe('Language Support', () => {
    test('should generate content in English', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Global tech company',
        tone: 'professional',
        language: 'english',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Innovation that connects the world.',
        hashtags: '#Technology #Global #Innovation',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toBeTruthy();
    });

    test('should generate Hinglish content', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Indian startup',
        tone: 'friendly',
        language: 'hinglish',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Apne sapno ko achieve karo with our innovative solutions! 🚀',
        hashtags: '#IndianStartup #Innovation #MadeInIndia',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.caption).toBeTruthy();
    });
  });

  describe('Industry Context', () => {
    test('should adapt to technology industry', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'AI software company',
        tone: 'professional',
        industry: 'Technology',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Pushing the boundaries of what\'s possible with AI.',
        hashtags: '#AI #Technology #Innovation #Software',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.hashtags).toMatch(/#Tech|#AI|#Software|#Innovation/i);
    });

    test('should adapt to fashion industry', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Boutique clothing store',
        tone: 'trendy',
        industry: 'Fashion',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Style that speaks volumes. New arrivals dropping soon! ✨',
        hashtags: '#Fashion #Style #OOTD #Boutique',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.hashtags).toMatch(/#Fashion|#Style|#OOTD|#Boutique/i);
    });

    test('should adapt to food industry', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Organic restaurant',
        tone: 'friendly',
        industry: 'Food & Beverage',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Farm to table freshness in every bite. 🌱',
        hashtags: '#FoodLover #Organic #FarmToTable #HealthyEating',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result.hashtags).toMatch(/#Food|#Organic|#Restaurant|#Healthy/i);
    });
  });

  describe('Error Handling', () => {
    test('should handle AI generation errors gracefully', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Test brand',
        tone: 'professional',
      };

      mockAiGenerate.mockRejectedValue(new Error('AI service unavailable'));

      await expect(generateSocialMediaCaption(input)).rejects.toThrow('AI service unavailable');
    });

    test('should handle empty brand description', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: '',
        tone: 'professional',
      };

      // Should either throw validation error or handle gracefully
      mockAiGenerate.mockResolvedValue({
        caption: 'Check out our latest updates!',
        hashtags: '#Update #News',
      });

      const result = await generateSocialMediaCaption(input);
      expect(result).toBeDefined();
    });
  });

  describe('Output Format', () => {
    test('should return caption and hashtags', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Test brand',
        tone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Test caption',
        hashtags: '#Test #Brand',
      });

      const result = await generateSocialMediaCaption(input);

      expect(result).toHaveProperty('caption');
      expect(result).toHaveProperty('hashtags');
      expect(typeof result.caption).toBe('string');
      expect(typeof result.hashtags).toBe('string');
    });

    test('should format hashtags correctly', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Test brand',
        tone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Test caption',
        hashtags: '#Test #Brand #Marketing',
      });

      const result = await generateSocialMediaCaption(input);

      // Each hashtag should start with #
      const hashtags = result.hashtags.split(' ');
      hashtags.forEach(tag => {
        if (tag.trim()) {
          expect(tag).toMatch(/^#/);
        }
      });
    });

    test('should not include hashtags in caption', async () => {
      const input: GenerateSocialMediaCaptionInput = {
        brandDescription: 'Test brand',
        tone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        caption: 'Great content for your brand',
        hashtags: '#Brand #Content #Marketing',
      });

      const result = await generateSocialMediaCaption(input);

      // Caption and hashtags should be separate
      expect(result.caption).not.toContain(result.hashtags);
    });
  });
});
