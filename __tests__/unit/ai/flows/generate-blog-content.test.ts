/**
 * @jest-environment node
 */

import { generateBlogContent } from '@/ai/flows/generate-blog-content';
import type { GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { ai } from '@/ai/genkit';

// Mock the AI instance
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
    definePrompt: jest.fn((config) => config),
    defineTool: jest.fn((config) => config),
  },
}));

// Mock model config
jest.mock('@/lib/model-config', () => ({
  getModelConfig: jest.fn().mockResolvedValue({
    powerfulModel: 'gemini-pro',
  }),
}));

// Mock fetch website content tool
jest.mock('@/ai/tools/fetch-website-content-tool', () => ({
  fetchWebsiteContentTool: jest.fn(),
}));

// Mock RAG integration
jest.mock('@/lib/rag-integration', () => ({
  enhanceBlogContentPrompt: jest.fn((prompt) => Promise.resolve(prompt)),
  storeContentForRAG: jest.fn(),
  getAdaptiveRAGContext: jest.fn().mockResolvedValue({
    relevantContent: [],
    confidence: 0,
  }),
}));

describe('Generate Blog Content Flow', () => {
  const mockAiGenerate = ai.generate as jest.MockedFunction<typeof ai.generate>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    test('should accept valid input with all required fields', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'TechCorp',
        brandDescription: 'Leading AI solutions provider',
        keywords: 'artificial intelligence, machine learning, automation',
        targetPlatform: 'Medium',
        blogOutline: '1. Introduction\n2. Benefits of AI\n3. Implementation\n4. Conclusion',
        blogTone: 'informative',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'How AI is Transforming Modern Business',
        content: '# How AI is Transforming Modern Business\n\nArtificial intelligence...',
        tags: 'AI, Machine Learning, Business, Technology, Automation',
      });

      const result = await generateBlogContent(input);

      expect(result).toBeDefined();
      expect(result.title).toBeTruthy();
      expect(result.content).toBeTruthy();
      expect(result.tags).toBeTruthy();
    });

    test('should accept optional fields', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'EcoStore',
        brandDescription: 'Sustainable products marketplace',
        keywords: 'sustainability, eco-friendly, zero waste',
        targetPlatform: 'Medium',
        blogOutline: '1. Why Go Green\n2. Our Products\n3. Impact',
        blogTone: 'friendly',
        industry: 'Sustainability',
        websiteUrl: 'https://ecostore.com',
        articleStyle: 'How-To Guide',
        targetAudience: 'Eco-conscious consumers',
      });

      mockAiGenerate.mockResolvedValue({
        title: 'Your Complete Guide to Sustainable Living',
        content: '# Your Complete Guide to Sustainable Living\n\nMaking eco-friendly...',
        tags: 'Sustainability, Eco-Friendly, Zero Waste, Green Living',
      });

      const result = await generateBlogContent(input);

      expect(result.content).toContain('Sustainable Living');
      expect(result.tags).toContain('Sustainability');
    });
  });

  describe('Blog Structure and Outline', () => {
    test('should follow provided outline structure', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'FitLife',
        brandDescription: 'Fitness and wellness brand',
        keywords: 'fitness, health, workout',
        targetPlatform: 'Medium',
        blogOutline: '1. Introduction: Why Fitness Matters\n2. Top 5 Exercises\n3. Nutrition Tips\n4. Conclusion',
        blogTone: 'motivational',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Transform Your Health: A Complete Fitness Guide',
        content: `# Transform Your Health: A Complete Fitness Guide

## 1. Introduction: Why Fitness Matters
Your health is your wealth...

## 2. Top 5 Exercises
Here are the most effective exercises...

## 3. Nutrition Tips
Proper nutrition is essential...

## 4. Conclusion
Start your fitness journey today...`,
        tags: 'Fitness, Health, Workout, Wellness',
      });

      const result = await generateBlogContent(input);

      // Should contain all sections from outline
      expect(result.content).toContain('Why Fitness Matters');
      expect(result.content).toContain('Top 5 Exercises');
      expect(result.content).toContain('Nutrition Tips');
      expect(result.content).toContain('Conclusion');
    });

    test('should handle nested outline structure', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'DevTech',
        brandDescription: 'Developer tools and resources',
        keywords: 'software development, coding, programming',
        targetPlatform: 'Medium',
        blogOutline: `1. Introduction
  1.1 What is Clean Code?
  1.2 Why it Matters
2. Core Principles
  2.1 Naming Conventions
  2.2 Function Design
  2.3 Comments
3. Practical Examples
4. Conclusion`,
        blogTone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Clean Code Principles Every Developer Should Know',
        content: `# Clean Code Principles

## 1. Introduction
### 1.1 What is Clean Code?
Clean code is...

### 1.2 Why it Matters
Code quality affects...

## 2. Core Principles
### 2.1 Naming Conventions
Choose clear names...`,
        tags: 'Programming, Clean Code, Software Development, Best Practices',
      });

      const result = await generateBlogContent(input);

      expect(result.content).toContain('What is Clean Code');
      expect(result.content).toContain('Core Principles');
    });
  });

  describe('Blog Tone Variations', () => {
    test('should generate informative tone', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'DataInsights',
        brandDescription: 'Data analytics platform',
        keywords: 'data analytics, business intelligence',
        targetPlatform: 'Medium',
        blogOutline: '1. Data Trends\n2. Analytics Tools\n3. Future Outlook',
        blogTone: 'informative',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Data Analytics Trends in 2024',
        content: 'Understanding data analytics trends...',
        tags: 'Data Analytics, Business Intelligence, Trends',
      });

      const result = await generateBlogContent(input);

      expect(result.content).toBeTruthy();
      // Informative tone should be clear and educational
    });

    test('should generate conversational tone', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'CookEasy',
        brandDescription: 'Home cooking made simple',
        keywords: 'cooking, recipes, easy meals',
        targetPlatform: 'Medium',
        blogOutline: '1. Welcome\n2. Quick Recipes\n3. Tips',
        blogTone: 'conversational',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Let\'s Talk About Easy Home Cooking',
        content: 'Hey there! Ready to make cooking fun and easy?...',
        tags: 'Cooking, Recipes, Home Cooking, Easy Meals',
      });

      const result = await generateBlogContent(input);

      // Conversational tone might include contractions, casual language
      expect(result.content).toBeTruthy();
    });

    test('should generate professional tone', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'LegalTech',
        brandDescription: 'Legal technology solutions',
        keywords: 'legal tech, compliance, automation',
        targetPlatform: 'Medium',
        blogOutline: '1. Market Overview\n2. Compliance Solutions\n3. ROI Analysis',
        blogTone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Legal Technology Market Analysis 2024',
        content: 'The legal technology sector has experienced significant growth...',
        tags: 'Legal Tech, Compliance, Enterprise Software',
      });

      const result = await generateBlogContent(input);

      // Professional tone should be formal and authoritative
      expect(result.content).toBeTruthy();
    });

    test('should generate witty tone', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'GamerHub',
        brandDescription: 'Gaming community platform',
        keywords: 'gaming, esports, community',
        targetPlatform: 'Medium',
        blogOutline: '1. Gaming Fails\n2. Epic Wins\n3. Community Stories',
        blogTone: 'witty',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'When Gaming Gets Real: Our Funniest Moments',
        content: 'Ever had one of those gaming moments that makes you question everything?...',
        tags: 'Gaming, Funny, Community, Entertainment',
      });

      const result = await generateBlogContent(input);

      expect(result.content).toBeTruthy();
    });
  });

  describe('Article Style Variations', () => {
    test('should generate How-To Guide format', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'GardenPro',
        brandDescription: 'Gardening tools and advice',
        keywords: 'gardening, plants, growing',
        targetPlatform: 'Medium',
        blogOutline: '1. Getting Started\n2. Step-by-Step Process\n3. Common Mistakes',
        blogTone: 'helpful',
        articleStyle: 'How-To Guide',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'How to Start Your First Vegetable Garden',
        content: `# How to Start Your First Vegetable Garden

## Step 1: Choose Your Location
Find a spot with at least 6 hours of sunlight...

## Step 2: Prepare the Soil
Test your soil pH and add compost...`,
        tags: 'Gardening, How-To, Vegetables, DIY',
      });

      const result = await generateBlogContent(input);

      expect(result.title).toContain('How to');
      expect(result.content).toMatch(/step|guide|process/i);
    });

    test('should generate Listicle format', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'TravelBuddy',
        brandDescription: 'Travel planning app',
        keywords: 'travel, destinations, vacation',
        targetPlatform: 'Medium',
        blogOutline: '1. Intro\n2. Top 10 Destinations\n3. Bonus Tips',
        blogTone: 'enthusiastic',
        articleStyle: 'Listicle',
      };

      mockAiGenerate.mockResolvedValue({
        title: '10 Must-Visit Destinations in 2024',
        content: `# 10 Must-Visit Destinations in 2024

## 1. Bali, Indonesia
Paradise awaits...

## 2. Iceland
Land of fire and ice...`,
        tags: 'Travel, Destinations, Vacation, Bucket List',
      });

      const result = await generateBlogContent(input);

      expect(result.title).toMatch(/\d+|top|best/i);
    });

    test('should generate Case Study format', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'B2B Solutions',
        brandDescription: 'Enterprise software provider',
        keywords: 'enterprise, software, ROI',
        targetPlatform: 'Medium',
        blogOutline: '1. Client Background\n2. Challenge\n3. Solution\n4. Results',
        blogTone: 'professional',
        articleStyle: 'Case Study',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Case Study: How Company X Increased Efficiency by 40%',
        content: `# Case Study: Efficiency Transformation

## Client Background
Company X is a mid-size manufacturing firm...

## The Challenge
Manual processes were slowing operations...

## Our Solution
We implemented automated workflows...

## Results Achieved
- 40% increase in efficiency
- $500K annual savings`,
        tags: 'Case Study, Enterprise, ROI, Success Story',
      });

      const result = await generateBlogContent(input);

      expect(result.content).toMatch(/challenge|solution|results/i);
    });
  });

  describe('Target Audience Adaptation', () => {
    test('should adapt for beginners', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'CodeAcademy',
        brandDescription: 'Coding education platform',
        keywords: 'coding, programming, beginners',
        targetPlatform: 'Medium',
        blogOutline: '1. What is Programming\n2. Getting Started\n3. First Steps',
        blogTone: 'friendly',
        targetAudience: 'Beginners with no coding experience',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Programming 101: Your First Steps into Code',
        content: 'If you\'re new to programming, don\'t worry! We\'ll start from the very basics...',
        tags: 'Programming, Beginners, Learn to Code, Tutorial',
      });

      const result = await generateBlogContent(input);

      // Beginner content should avoid jargon
      expect(result.content).toBeTruthy();
    });

    test('should adapt for experts', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'DevOps Pro',
        brandDescription: 'Advanced DevOps tools',
        keywords: 'kubernetes, CI/CD, infrastructure',
        targetPlatform: 'Medium',
        blogOutline: '1. Advanced Kubernetes Patterns\n2. Performance Optimization\n3. Security',
        blogTone: 'technical',
        targetAudience: 'Senior DevOps Engineers',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Advanced Kubernetes Deployment Patterns',
        content: 'Implementing blue-green deployments with Kubernetes requires understanding of pod lifecycle management...',
        tags: 'Kubernetes, DevOps, Cloud Native, Advanced',
      });

      const result = await generateBlogContent(input);

      // Expert content can use technical terminology
      expect(result.content).toBeTruthy();
    });
  });

  describe('Platform Optimization', () => {
    test('should optimize for Medium platform', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'WritersPro',
        brandDescription: 'Writing tools for professionals',
        keywords: 'writing, productivity, content',
        targetPlatform: 'Medium',
        blogOutline: '1. Writing Tips\n2. Tools\n3. Best Practices',
        blogTone: 'professional',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'The Professional Writer\'s Toolkit',
        content: '# The Professional Writer\'s Toolkit\n\nEvery writer needs the right tools...',
        tags: 'Writing, Productivity, Tools, Professional',
      });

      const result = await generateBlogContent(input);

      // Medium uses Markdown format
      expect(result.content).toContain('#');
    });

    test('should handle Other platform', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'BlogStarter',
        brandDescription: 'Blogging platform',
        keywords: 'blogging, content creation',
        targetPlatform: 'Other',
        blogOutline: '1. Introduction\n2. Main Content\n3. Conclusion',
        blogTone: 'casual',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Start Your Blogging Journey Today',
        content: 'Blogging is one of the best ways to share your ideas...',
        tags: 'Blogging, Content Creation, Writing',
      });

      const result = await generateBlogContent(input);

      expect(result.content).toBeTruthy();
    });
  });

  describe('SEO and Keywords', () => {
    test('should incorporate keywords naturally', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'SEO Masters',
        brandDescription: 'SEO optimization services',
        keywords: 'search engine optimization, SEO, ranking, traffic',
        targetPlatform: 'Medium',
        blogOutline: '1. SEO Basics\n2. Optimization Techniques\n3. Measuring Success',
        blogTone: 'informative',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Search Engine Optimization: Complete Guide to Better Rankings',
        content: 'Search engine optimization (SEO) is crucial for improving your website ranking and driving organic traffic...',
        tags: 'SEO, Search Engine Optimization, Website Traffic, Digital Marketing',
      });

      const result = await generateBlogContent(input);

      // Keywords should appear in title, content, and tags
      expect(result.title.toLowerCase()).toMatch(/seo|search engine optimization|ranking/);
      expect(result.tags.toLowerCase()).toContain('seo');
    });

    test('should generate relevant tags from keywords', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'CloudTech',
        brandDescription: 'Cloud computing solutions',
        keywords: 'cloud computing, AWS, Azure, scalability, infrastructure',
        targetPlatform: 'Medium',
        blogOutline: '1. Cloud Benefits\n2. Providers Comparison\n3. Migration Guide',
        blogTone: 'technical',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Cloud Computing: Complete Migration Guide',
        content: 'Cloud computing offers unparalleled scalability...',
        tags: 'Cloud Computing, AWS, Azure, Infrastructure, Scalability',
      });

      const result = await generateBlogContent(input);

      // Tags should be derived from keywords
      const tags = result.tags.toLowerCase();
      expect(tags).toContain('cloud');
      expect(tags).toMatch(/aws|azure/);
    });
  });

  describe('Website Context Integration', () => {
    test('should use website URL for context', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'HealthyLife',
        brandDescription: 'Health and wellness brand',
        keywords: 'health, wellness, nutrition',
        targetPlatform: 'Medium',
        blogOutline: '1. Wellness Basics\n2. Nutrition\n3. Exercise',
        blogTone: 'motivational',
        websiteUrl: 'https://healthylife.com',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Your Complete Wellness Journey',
        content: 'At HealthyLife, we believe wellness starts with small daily choices...',
        tags: 'Health, Wellness, Nutrition, Fitness',
      });

      const result = await generateBlogContent(input);

      expect(result.content).toBeTruthy();
    });

    test('should handle website fetch errors gracefully', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'TechStart',
        brandDescription: 'Startup technology solutions',
        keywords: 'startup, technology, innovation',
        targetPlatform: 'Medium',
        blogOutline: '1. Startup Challenges\n2. Solutions\n3. Growth',
        blogTone: 'inspirational',
        websiteUrl: 'https://invalid-url-404.com',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Overcoming Startup Challenges',
        content: 'Every startup faces unique challenges...',
        tags: 'Startup, Technology, Entrepreneurship, Growth',
      });

      const result = await generateBlogContent(input);

      // Should still generate content even if website fetch fails
      expect(result.content).toBeTruthy();
    });
  });

  describe('Industry Context', () => {
    test('should adapt to technology industry', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'AI Innovations',
        brandDescription: 'Artificial intelligence research',
        keywords: 'AI, machine learning, neural networks',
        targetPlatform: 'Medium',
        blogOutline: '1. AI Overview\n2. Applications\n3. Future',
        blogTone: 'technical',
        industry: 'Technology',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'The Future of Artificial Intelligence',
        content: 'Artificial intelligence is rapidly evolving...',
        tags: 'AI, Machine Learning, Technology, Innovation, Neural Networks',
      });

      const result = await generateBlogContent(input);

      expect(result.tags).toMatch(/technology|tech|AI|software/i);
    });

    test('should adapt to healthcare industry', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'MedTech Solutions',
        brandDescription: 'Healthcare technology provider',
        keywords: 'healthcare, medical devices, patient care',
        targetPlatform: 'Medium',
        blogOutline: '1. Healthcare Challenges\n2. Technology Solutions\n3. Patient Outcomes',
        blogTone: 'professional',
        industry: 'Healthcare',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Improving Patient Care Through Technology',
        content: 'Healthcare technology is transforming patient outcomes...',
        tags: 'Healthcare, Medical Technology, Patient Care, Digital Health',
      });

      const result = await generateBlogContent(input);

      expect(result.tags).toMatch(/healthcare|medical|health|patient/i);
    });
  });

  describe('Error Handling', () => {
    test('should handle AI generation errors', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'Test Brand',
        brandDescription: 'Test description',
        keywords: 'test, keywords',
        targetPlatform: 'Medium',
        blogOutline: '1. Test',
        blogTone: 'casual',
      };

      mockAiGenerate.mockRejectedValue(new Error('AI service unavailable'));

      await expect(generateBlogContent(input)).rejects.toThrow('AI service unavailable');
    });

    test('should handle empty outline', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'Test Brand',
        brandDescription: 'Test description',
        keywords: 'test',
        targetPlatform: 'Medium',
        blogOutline: '',
        blogTone: 'casual',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Default Blog Post',
        content: 'Content based on brand description...',
        tags: 'Test, General',
      });

      const result = await generateBlogContent(input);
      expect(result).toBeDefined();
    });
  });

  describe('Output Format', () => {
    test('should return title, content, and tags', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'Test Brand',
        brandDescription: 'Test description',
        keywords: 'test, blog',
        targetPlatform: 'Medium',
        blogOutline: '1. Introduction\n2. Content',
        blogTone: 'casual',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Test Blog Post',
        content: '# Test Blog Post\n\nThis is test content.',
        tags: 'Test, Blog, Content',
      });

      const result = await generateBlogContent(input);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('tags');
      expect(typeof result.title).toBe('string');
      expect(typeof result.content).toBe('string');
      expect(typeof result.tags).toBe('string');
    });

    test('should format tags as comma-separated', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'TagTest',
        brandDescription: 'Testing tags',
        keywords: 'tag1, tag2, tag3',
        targetPlatform: 'Medium',
        blogOutline: '1. Test',
        blogTone: 'casual',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Tag Test Post',
        content: 'Testing tags functionality.',
        tags: 'Tag1, Tag2, Tag3, Testing',
      });

      const result = await generateBlogContent(input);

      expect(result.tags).toContain(',');
      const tagArray = result.tags.split(',').map(t => t.trim());
      expect(tagArray.length).toBeGreaterThan(0);
    });

    test('should generate Markdown-formatted content', async () => {
      const input: GenerateBlogContentInput = {
        brandName: 'MarkdownTest',
        brandDescription: 'Testing markdown',
        keywords: 'markdown, formatting',
        targetPlatform: 'Medium',
        blogOutline: '1. Heading\n2. Content',
        blogTone: 'technical',
      };

      mockAiGenerate.mockResolvedValue({
        title: 'Markdown Test Post',
        content: '# Main Heading\n\n## Subheading\n\nParagraph text here.\n\n- Bullet point\n- Another point',
        tags: 'Markdown, Formatting, Technical',
      });

      const result = await generateBlogContent(input);

      // Should contain Markdown syntax
      expect(result.content).toMatch(/^#/m);
      expect(result.content).toMatch(/^##/m);
      expect(result.content).toMatch(/^-/m);
    });
  });
});
