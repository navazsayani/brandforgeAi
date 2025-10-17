/**
 * @jest-environment node
 */

import { generateAdCampaign } from '@/ai/flows/generate-ad-campaign';
import type { GenerateAdCampaignInput } from '@/ai/flows/generate-ad-campaign';
import { ai } from '@/ai/genkit';

jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
    definePrompt: jest.fn((config) => config),
    defineFlow: jest.fn((config, implementation) => implementation),
  },
}));

jest.mock('@/lib/model-config', () => ({
  getModelConfig: jest.fn().mockResolvedValue({
    powerfulModel: 'gemini-pro',
  }),
}));

jest.mock('@/lib/rag-integration', () => ({
  enhanceAdCampaignPrompt: jest.fn((prompt) => Promise.resolve(prompt)),
  storeContentForRAG: jest.fn(),
  getAdaptiveRAGContext: jest.fn().mockResolvedValue({
    relevantContent: [],
    confidence: 0,
  }),
}));

describe('Generate Ad Campaign Flow', () => {
  const mockAiGenerate = ai.generate as jest.MockedFunction<typeof ai.generate>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    test('should accept valid input with all fields', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'EcoShop',
        brandDescription: 'Sustainable products marketplace',
        generatedContent: 'Shop eco-friendly products that make a difference',
        targetKeywords: 'sustainable, eco-friendly, green living',
        budget: 5000,
        platforms: ['google_ads', 'meta'],
        campaignGoal: 'Sales Conversion',
        targetAudience: 'Environmentally conscious millennials',
        callToAction: 'Shop Now',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Sustainable Living Made Easy',
        headlines: [
          'Transform Your Lifestyle with Sustainable Products',
          'Eco-Friendly Solutions for Modern Living',
          'Join the Green Revolution Today'
        ],
        bodyTexts: [
          'Discover sustainable products that don\'t compromise on quality. Shop our curated collection today.',
          'Make a positive impact with every purchase. Eco-friendly, affordable, and delivered to your door.'
        ],
        platformGuidance: 'Test headline variations on Google Ads. Use carousel format on Meta for product showcase.',
      });

      const result = await generateAdCampaign(input);

      expect(result).toBeDefined();
      expect(result.campaignConcept).toBeTruthy();
      expect(result.headlines).toHaveLength(3);
      expect(result.bodyTexts).toHaveLength(2);
      expect(result.platformGuidance).toBeTruthy();
    });

    test('should accept optional fields', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'TechStart',
        brandDescription: 'Innovative tech solutions',
        generatedContent: 'Revolutionary AI technology',
        targetKeywords: 'AI, technology, innovation',
        budget: 10000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'AI Innovation for Everyone',
        headlines: [
          'AI Technology That Works For You',
          'Innovation Simplified',
          'Smart Solutions, Real Results'
        ],
        bodyTexts: [
          'Experience the power of AI technology designed for your business.',
          'Transform your operations with cutting-edge AI solutions.'
        ],
        platformGuidance: 'Focus on search ads with strong keywords.',
      });

      const result = await generateAdCampaign(input);

      expect(result).toBeDefined();
    });
  });

  describe('Campaign Goals', () => {
    test('should optimize for brand awareness goal', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'NewBrand',
        brandDescription: 'Fresh startup in tech space',
        generatedContent: 'Introducing our innovative platform',
        targetKeywords: 'innovation, startup, tech',
        budget: 3000,
        platforms: ['meta'],
        campaignGoal: 'Brand Awareness',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Meet the Future of Tech',
        headlines: [
          'Introducing NewBrand: Innovation Redefined',
          'The Future of Tech is Here',
          'Meet Your New Favorite Tech Platform'
        ],
        bodyTexts: [
          'Discover a new way to innovate. Join thousands already experiencing the difference.',
          'We\'re changing the game in tech. Be part of the revolution.'
        ],
        platformGuidance: 'Use video ads and carousel for maximum reach on Meta.',
      });

      const result = await generateAdCampaign(input);

      // Brand awareness should focus on introduction and discovery
      expect(result.headlines.some(h => h.toLowerCase().includes('introducing') ||
                                       h.toLowerCase().includes('meet') ||
                                       h.toLowerCase().includes('discover'))).toBe(true);
    });

    test('should optimize for sales conversion goal', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'ShopDirect',
        brandDescription: 'Online retail store',
        generatedContent: 'Flash sale on all products',
        targetKeywords: 'sale, discount, shop',
        budget: 8000,
        platforms: ['google_ads', 'meta'],
        campaignGoal: 'Sales Conversion',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Unbeatable Deals, Limited Time',
        headlines: [
          'Save Big Today - Limited Time Offer',
          'Flash Sale: Up to 50% Off Everything',
          'Shop Now & Save - Sale Ends Soon'
        ],
        bodyTexts: [
          'Don\'t miss out! Shop our biggest sale of the year. Limited quantities available.',
          'Incredible savings on all products. Free shipping on orders over $50. Shop now!'
        ],
        platformGuidance: 'Use urgency messaging and countdown timers. Shopping ads on Google, dynamic product ads on Meta.',
      });

      const result = await generateAdCampaign(input);

      // Sales conversion should have urgency and clear CTAs
      expect(result.headlines.some(h => h.toLowerCase().includes('save') ||
                                       h.toLowerCase().includes('sale') ||
                                       h.toLowerCase().includes('now'))).toBe(true);
    });

    test('should optimize for lead generation goal', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'B2B Solutions',
        brandDescription: 'Enterprise software provider',
        generatedContent: 'Free consultation for businesses',
        targetKeywords: 'enterprise, software, consultation',
        budget: 15000,
        platforms: ['google_ads'],
        campaignGoal: 'Lead Generation',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Transform Your Business - Free Consultation',
        headlines: [
          'Get Your Free Enterprise Consultation Today',
          'Book a Free Demo - See the Difference',
          'Free Business Assessment - Limited Spots'
        ],
        bodyTexts: [
          'Schedule your free consultation with our experts. No commitment required.',
          'Discover how our software can transform your operations. Book your free demo now.'
        ],
        platformGuidance: 'Lead form extensions on Google Ads. Focus on value proposition.',
      });

      const result = await generateAdCampaign(input);

      expect(result.headlines.some(h => h.toLowerCase().includes('free'))).toBe(true);
    });
  });

  describe('Platform Optimization', () => {
    test('should optimize for Google Ads', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'LocalService',
        brandDescription: 'Local home services',
        generatedContent: 'Professional home cleaning',
        targetKeywords: 'home cleaning, professional service',
        budget: 2000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Professional Home Cleaning You Can Trust',
        headlines: [
          'Professional Home Cleaning Services',
          'Trusted Local Cleaners - Book Today',
          'Spotless Homes, Guaranteed'
        ],
        bodyTexts: [
          'Professional cleaning services for your home. Licensed, insured, and highly rated.',
          'Book online in minutes. Same-day service available. 100% satisfaction guaranteed.'
        ],
        platformGuidance: 'Use location extensions and call extensions. Focus on search ads with local keywords.',
      });

      const result = await generateAdCampaign(input);

      expect(result.platformGuidance.toLowerCase()).toContain('google');
    });

    test('should optimize for Meta (Facebook/Instagram)', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'FashionBrand',
        brandDescription: 'Trendy clothing line',
        generatedContent: 'New summer collection',
        targetKeywords: 'fashion, trendy, summer',
        budget: 5000,
        platforms: ['meta'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Summer Style Refresh',
        headlines: [
          'Your Summer Wardrobe Upgrade is Here',
          'Trending Now: Summer Collection 2024',
          'Slay This Summer - New Arrivals'
        ],
        bodyTexts: [
          'Refresh your style with our latest summer collection. Trendy pieces, unbeatable prices.',
          'From beach days to rooftop nights - we\'ve got your summer style covered.'
        ],
        platformGuidance: 'Use Instagram Stories and Reels. Carousel ads showcasing collection. User-generated content performs well.',
      });

      const result = await generateAdCampaign(input);

      expect(result.platformGuidance.toLowerCase()).toMatch(/meta|facebook|instagram/);
    });

    test('should optimize for multi-platform campaigns', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'GlobalBrand',
        brandDescription: 'International e-commerce',
        generatedContent: 'Worldwide shopping experience',
        targetKeywords: 'shopping, international, delivery',
        budget: 20000,
        platforms: ['google_ads', 'meta'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Shop Globally, Delivered Locally',
        headlines: [
          'Shop the World - Delivered to Your Door',
          'International Brands, Local Delivery',
          'Global Shopping Made Easy'
        ],
        bodyTexts: [
          'Access international brands with local delivery. Shop now and get free shipping.',
          'Discover products from around the world. Fast shipping, easy returns.'
        ],
        platformGuidance: 'Google: Shopping ads + search. Meta: Carousel ads with international products. Consistent messaging across platforms.',
      });

      const result = await generateAdCampaign(input);

      expect(result.platformGuidance).toContain('Google');
      expect(result.platformGuidance).toContain('Meta');
    });
  });

  describe('Target Audience Adaptation', () => {
    test('should adapt for millennials', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'TrendyTech',
        brandDescription: 'Tech gadgets for young professionals',
        generatedContent: 'Latest tech trends',
        targetKeywords: 'tech, gadgets, modern',
        budget: 6000,
        platforms: ['meta'],
        targetAudience: 'Millennials aged 25-35',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Tech That Fits Your Lifestyle',
        headlines: [
          'Tech Gadgets That Actually Matter',
          'Upgrade Your Daily Grind',
          'Smart Tech for Smart People'
        ],
        bodyTexts: [
          'The tech you need, minus the fluff. Curated gadgets for real life.',
          'Work smarter, live better. Discover tech that actually improves your day.'
        ],
        platformGuidance: 'Instagram and Facebook ads. Use lifestyle imagery and aspirational messaging.',
      });

      const result = await generateAdCampaign(input);

      expect(result).toBeDefined();
    });

    test('should adapt for seniors', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'SeniorCare',
        brandDescription: 'Health monitoring devices',
        generatedContent: 'Easy-to-use health trackers',
        targetKeywords: 'health, monitoring, easy',
        budget: 4000,
        platforms: ['google_ads'],
        targetAudience: 'Seniors 65+',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Simple Health Monitoring',
        headlines: [
          'Easy Health Tracking for Peace of Mind',
          'Stay Healthy, Stay Independent',
          'Simple Health Monitoring - No Tech Skills Needed'
        ],
        bodyTexts: [
          'Monitor your health with confidence. Easy-to-use devices with 24/7 support.',
          'Stay independent with simple health tracking. Large display, easy setup, reliable monitoring.'
        ],
        platformGuidance: 'Search ads with clear, simple language. Emphasize ease of use and support.',
      });

      const result = await generateAdCampaign(input);

      expect(result.headlines.some(h => h.toLowerCase().includes('easy') ||
                                       h.toLowerCase().includes('simple'))).toBe(true);
    });

    test('should adapt for B2B audience', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'EnterpriseTools',
        brandDescription: 'Business productivity software',
        generatedContent: 'Increase team productivity',
        targetKeywords: 'enterprise, productivity, efficiency',
        budget: 25000,
        platforms: ['google_ads'],
        targetAudience: 'C-level executives and IT managers',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Enterprise Efficiency, Proven Results',
        headlines: [
          'Boost Productivity by 40% - Proven ROI',
          'Enterprise Solutions That Scale',
          'Trusted by Fortune 500 Companies'
        ],
        bodyTexts: [
          'Increase team efficiency with enterprise-grade tools. See ROI in 90 days. Schedule a demo.',
          'Scalable solutions for growing enterprises. 24/7 support, 99.9% uptime guarantee.'
        ],
        platformGuidance: 'LinkedIn integration via Meta Business. Search ads targeting business decision keywords.',
      });

      const result = await generateAdCampaign(input);

      expect(result.headlines.some(h => h.toLowerCase().includes('enterprise') ||
                                       h.toLowerCase().includes('roi') ||
                                       h.toLowerCase().includes('proven'))).toBe(true);
    });
  });

  describe('Budget Considerations', () => {
    test('should adapt for small budget', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'LocalCafe',
        brandDescription: 'Community coffee shop',
        generatedContent: 'Best coffee in town',
        targetKeywords: 'coffee, local, cafe',
        budget: 500,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Your Local Coffee Spot',
        headlines: [
          'Best Coffee in [City] - Visit Today',
          'Local Coffee, Community Vibes',
          'Your Morning Coffee Awaits'
        ],
        bodyTexts: [
          'Start your day right with locally roasted coffee. Visit us today!',
          'Community-focused coffee shop. Great coffee, friendly service, local love.'
        ],
        platformGuidance: 'Focus on local search ads. Use location targeting. Small budget: prioritize high-intent keywords.',
      });

      const result = await generateAdCampaign(input);

      expect(result.platformGuidance.toLowerCase()).toContain('local');
    });

    test('should adapt for large budget', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'GlobalCorp',
        brandDescription: 'International enterprise solutions',
        generatedContent: 'Industry-leading software',
        targetKeywords: 'enterprise, global, solutions',
        budget: 100000,
        platforms: ['google_ads', 'meta'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Global Leadership in Enterprise Tech',
        headlines: [
          'Industry Leader in Enterprise Solutions',
          'Trusted by 10,000+ Companies Worldwide',
          'Enterprise Software That Transforms Business'
        ],
        bodyTexts: [
          'Join the world\'s leading enterprises. Scalable solutions, global support, proven results.',
          'Transform your operations with industry-leading software. Request a custom demo today.'
        ],
        platformGuidance: 'Multi-channel strategy: Google search, display, YouTube. Meta: LinkedIn integration, retargeting. Consider remarketing lists.',
      });

      const result = await generateAdCampaign(input);

      expect(result.platformGuidance.toLowerCase()).toMatch(/multi|channel|remarketing|retargeting/);
    });
  });

  describe('Industry Context', () => {
    test('should adapt to e-commerce industry', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'ShopOnline',
        brandDescription: 'Online shopping platform',
        industry: 'E-commerce',
        generatedContent: 'Shop thousands of products',
        targetKeywords: 'online shopping, deals, products',
        budget: 10000,
        platforms: ['google_ads', 'meta'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Your One-Stop Shopping Destination',
        headlines: [
          'Shop Thousands of Products Online',
          'Best Deals, Fast Shipping',
          'Online Shopping Made Easy'
        ],
        bodyTexts: [
          'Discover amazing deals on thousands of products. Free shipping over $50.',
          'Shop with confidence. Easy returns, secure checkout, fast delivery.'
        ],
        platformGuidance: 'Shopping ads on Google. Dynamic product ads on Meta. Use product feeds.',
      });

      const result = await generateAdCampaign(input);

      expect(result.platformGuidance.toLowerCase()).toMatch(/shopping|product/);
    });

    test('should adapt to healthcare industry', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'HealthFirst',
        brandDescription: 'Healthcare services',
        industry: 'Healthcare',
        generatedContent: 'Quality healthcare for all',
        targetKeywords: 'healthcare, medical, treatment',
        budget: 8000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Compassionate Care, Expert Treatment',
        headlines: [
          'Quality Healthcare You Can Trust',
          'Expert Medical Care When You Need It',
          'Your Health, Our Priority'
        ],
        bodyTexts: [
          'Experienced healthcare professionals dedicated to your wellbeing. Book an appointment today.',
          'Comprehensive medical services with compassionate care. Accepting new patients.'
        ],
        platformGuidance: 'Healthcare advertising requires compliance. Focus on trust signals and professional tone.',
      });

      const result = await generateAdCampaign(input);

      expect(result.headlines.some(h => h.toLowerCase().includes('care') ||
                                       h.toLowerCase().includes('health'))).toBe(true);
    });
  });

  describe('Call to Action Integration', () => {
    test('should integrate specific CTA', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'AppDownload',
        brandDescription: 'Mobile productivity app',
        generatedContent: 'Download our app today',
        targetKeywords: 'productivity, app, mobile',
        budget: 7000,
        platforms: ['meta'],
        callToAction: 'Download Now',
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Productivity in Your Pocket',
        headlines: [
          'Download the #1 Productivity App',
          'Get More Done - Download Now',
          'Your Productivity Solution Awaits'
        ],
        bodyTexts: [
          'Transform your workflow with our app. Download now and get 30 days free!',
          'Join millions of productive users. Download now and boost your efficiency.'
        ],
        platformGuidance: 'App install campaigns on Meta. Use app event optimization.',
      });

      const result = await generateAdCampaign(input);

      expect(result.headlines.some(h => h.toLowerCase().includes('download'))).toBe(true);
      expect(result.bodyTexts.some(b => b.toLowerCase().includes('download'))).toBe(true);
    });
  });

  describe('Headline Quality', () => {
    test('should generate 3 distinct headlines', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'TestBrand',
        brandDescription: 'Test description',
        generatedContent: 'Test content',
        targetKeywords: 'test, keywords',
        budget: 5000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Test Campaign',
        headlines: [
          'First Unique Headline',
          'Second Different Headline',
          'Third Distinct Headline'
        ],
        bodyTexts: [
          'First body text variation.',
          'Second body text variation.'
        ],
        platformGuidance: 'Test different headline variations.',
      });

      const result = await generateAdCampaign(input);

      expect(result.headlines).toHaveLength(3);
      // Headlines should be distinct
      expect(new Set(result.headlines).size).toBe(3);
    });

    test('should keep headlines concise for Google Ads', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'ConciseBrand',
        brandDescription: 'Brief description',
        generatedContent: 'Short content',
        targetKeywords: 'brief, concise',
        budget: 3000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Concise Campaign',
        headlines: [
          'Quality Products, Great Prices',
          'Shop Smart, Save More',
          'Your Trusted Source'
        ],
        bodyTexts: [
          'Discover quality products at unbeatable prices.',
          'Shop with confidence. Fast shipping, easy returns.'
        ],
        platformGuidance: 'Keep headlines under 30 characters for optimal display.',
      });

      const result = await generateAdCampaign(input);

      // Google Ads headlines should be reasonably short
      result.headlines.forEach(headline => {
        expect(headline.length).toBeLessThan(100);
      });
    });
  });

  describe('Body Text Quality', () => {
    test('should generate 2 distinct body texts', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'TestBrand',
        brandDescription: 'Test description',
        generatedContent: 'Test content',
        targetKeywords: 'test',
        budget: 5000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Test Campaign',
        headlines: ['H1', 'H2', 'H3'],
        bodyTexts: [
          'First body text with unique messaging and value proposition.',
          'Second body text with different angle and complementary information.'
        ],
        platformGuidance: 'Test both body text variations.',
      });

      const result = await generateAdCampaign(input);

      expect(result.bodyTexts).toHaveLength(2);
      expect(new Set(result.bodyTexts).size).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle AI generation errors', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'ErrorTest',
        brandDescription: 'Test',
        generatedContent: 'Test',
        targetKeywords: 'test',
        budget: 1000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockRejectedValue(new Error('AI service unavailable'));

      await expect(generateAdCampaign(input)).rejects.toThrow('AI service unavailable');
    });
  });

  describe('Output Format', () => {
    test('should return all required fields', async () => {
      const input: GenerateAdCampaignInput = {
        brandName: 'CompleteTest',
        brandDescription: 'Full test',
        generatedContent: 'Complete content',
        targetKeywords: 'complete, test',
        budget: 5000,
        platforms: ['google_ads'],
      };

      mockAiGenerate.mockResolvedValue({
        campaignConcept: 'Complete Campaign Concept',
        headlines: ['H1', 'H2', 'H3'],
        bodyTexts: ['Body 1', 'Body 2'],
        platformGuidance: 'Platform guidance text',
      });

      const result = await generateAdCampaign(input);

      expect(result).toHaveProperty('campaignConcept');
      expect(result).toHaveProperty('headlines');
      expect(result).toHaveProperty('bodyTexts');
      expect(result).toHaveProperty('platformGuidance');
      expect(Array.isArray(result.headlines)).toBe(true);
      expect(Array.isArray(result.bodyTexts)).toBe(true);
    });
  });
});
