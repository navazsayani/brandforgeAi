/**
 * @jest-environment node
 */

import {
  contentTemplates,
  getUniversalTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getTemplatesForUser,
  buildTemplatePrompt,
  type ContentTemplate
} from '@/lib/content-templates';
import type { BrandData } from '@/types';

describe('Content Templates', () => {
  const mockBrandData: BrandData = {
    brandName: 'Test Brand',
    brandDescription: 'A modern tech company focused on innovation',
    industry: 'Technology',
    imageStyleNotes: 'Clean, minimalist aesthetic',
    targetKeywords: 'innovation, tech, modern',
    websiteUrl: 'https://testbrand.com',
    plan: 'free',
    userEmail: 'test@example.com',
    exampleImages: [],
    brandLogoUrl: '',
    subscriptionEndDate: null,
    welcomeGiftOffered: false,
    hasUsedPreviewMode: false
  };

  describe('Template Structure', () => {
    test('should have 26 templates total', () => {
      expect(contentTemplates).toHaveLength(26);
    });

    test('all templates should have required properties', () => {
      contentTemplates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('icon');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('industries');
        expect(template).toHaveProperty('presets');
        expect(template).toHaveProperty('requiredUserInputs');
        expect(template).toHaveProperty('estimatedTime');
        expect(template).toHaveProperty('premium');
        expect(template).toHaveProperty('tags');
      });
    });

    test('should have 15 image templates', () => {
      const imageTemplates = contentTemplates.filter(t => t.category === 'image');
      expect(imageTemplates).toHaveLength(15);
    });

    test('should have 11 social templates', () => {
      const socialTemplates = contentTemplates.filter(t => t.category === 'social');
      expect(socialTemplates).toHaveLength(11);
    });

    test('all templates should be universal (no industry restrictions)', () => {
      contentTemplates.forEach(template => {
        expect(template.industries).toBeNull();
      });
    });

    test('all templates should be free tier', () => {
      contentTemplates.forEach(template => {
        expect(template.premium).toBe(false);
      });
    });
  });

  describe('Helper Functions', () => {
    test('getUniversalTemplates should return all templates', () => {
      const universal = getUniversalTemplates();
      expect(universal).toHaveLength(26);
    });

    test('getTemplatesByCategory should filter by category', () => {
      const imageTemplates = getTemplatesByCategory('image');
      const socialTemplates = getTemplatesByCategory('social');

      expect(imageTemplates).toHaveLength(15);
      expect(socialTemplates).toHaveLength(11);

      imageTemplates.forEach(t => expect(t.category).toBe('image'));
      socialTemplates.forEach(t => expect(t.category).toBe('social'));
    });

    test('getTemplateById should return correct template', () => {
      const template = getTemplateById('product_photo');
      expect(template).toBeDefined();
      expect(template?.id).toBe('product_photo');
      expect(template?.name).toBe('Product Photo');
    });

    test('getTemplateById should return undefined for invalid id', () => {
      const template = getTemplateById('nonexistent');
      expect(template).toBeUndefined();
    });

    test('getTemplatesForUser should return all templates for any industry', () => {
      const templates = getTemplatesForUser('Technology');
      expect(templates).toHaveLength(26);
    });
  });

  describe('Image Template Prompt Building', () => {
    test('should build product photo prompt correctly', () => {
      const template = getTemplateById('product_photo')!;
      const userInput = {
        productDescription: 'Organic lavender body butter',
        backgroundStyle: 'White/Clean'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Organic lavender body butter');
      expect(result.finalPrompt).toContain('Test Brand');
      expect(result.finalPrompt).toContain('Technology');
      expect(result.autoFilledFields.imageStyle).toBe('photorealistic');
      expect(result.autoFilledFields.aspectRatio).toBe('1:1');
      expect(result.autoFilledFields.negativePrompt).toContain('blurry');
    });

    test('should build hero banner prompt correctly', () => {
      const template = getTemplateById('hero_banner')!;
      const userInput = {
        keyMessage: 'Innovation in tech',
        mood: 'Professional'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Innovation in tech');
      expect(result.finalPrompt).toContain('Professional');
      expect(result.autoFilledFields.aspectRatio).toBe('16:9');
    });

    test('should build quote graphic prompt correctly', () => {
      const template = getTemplateById('quote_graphic')!;
      const userInput = {
        quote: 'Success is not final, failure is not fatal',
        visualStyle: 'Minimalist'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Success is not final');
      expect(result.finalPrompt).toContain('Minimalist');
      expect(result.autoFilledFields.negativePrompt).toContain('illegible text');
    });

    test('should build behind-the-scenes prompt correctly', () => {
      const template = getTemplateById('behind_scenes')!;
      const userInput = {
        sceneDescription: 'Team brainstorming session'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Team brainstorming session');
      expect(result.finalPrompt).toContain('Authentic');
    });

    test('should build flat lay prompt correctly', () => {
      const template = getTemplateById('flat_lay')!;
      const userInput = {
        items: 'Tech gadgets and coffee'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Tech gadgets and coffee');
      expect(result.finalPrompt).toContain('overhead');
    });

    test('should build social story prompt with vertical aspect ratio', () => {
      const template = getTemplateById('social_story')!;
      const userInput = {
        storyContent: 'New product teaser'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('New product teaser');
      expect(result.autoFilledFields.aspectRatio).toBe('9:16');
    });
  });

  describe('Social Template Prompt Building', () => {
    test('should build product launch social prompt correctly', () => {
      const template = getTemplateById('product_launch')!;
      const userInput = {
        productName: 'TechWidget Pro',
        targetAudience: 'tech enthusiasts',
        callToAction: 'Shop now'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.autoFilledFields.postGoal).toBe('promotion');
      expect(result.autoFilledFields.tone).toBe('professional');
      expect(result.autoFilledFields.targetAudience).toBe('tech enthusiasts');
      expect(result.autoFilledFields.callToAction).toBe('Shop now');
      expect(result.autoFilledFields.imageDescription).toContain('TechWidget Pro');
    });

    test('should build quick tip social prompt correctly', () => {
      const template = getTemplateById('quick_tip')!;
      const userInput = {
        tipTopic: 'productivity hacks',
        targetAudience: 'busy professionals'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.autoFilledFields.postGoal).toBe('informational');
      expect(result.autoFilledFields.tone).toBe('friendly');
      expect(result.autoFilledFields.imageDescription).toContain('productivity hacks');
    });

    test('should build question post social prompt correctly', () => {
      const template = getTemplateById('question_post')!;
      const userInput = {
        questionTopic: 'favorite features',
        targetAudience: 'our community'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.autoFilledFields.postGoal).toBe('engagement');
      expect(result.autoFilledFields.callToAction).toContain('Share your thoughts');
    });

    test('should build milestone celebration prompt correctly', () => {
      const template = getTemplateById('milestone')!;
      const userInput = {
        milestoneDescription: '10k followers',
        targetAudience: 'our amazing community'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.autoFilledFields.postGoal).toBe('community_building');
      expect(result.autoFilledFields.tone).toBe('inspirational');
    });

    test('should build contest/giveaway prompt correctly', () => {
      const template = getTemplateById('contest_giveaway')!;
      const userInput = {
        contestPrize: '$100 gift card',
        entryMethod: 'Like and comment',
        targetAudience: 'our followers'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.autoFilledFields.postGoal).toBe('promotion');
      expect(result.autoFilledFields.callToAction).toBe('Like and comment');
    });

    test('should build seasonal post prompt correctly', () => {
      const template = getTemplateById('seasonal_timely')!;
      const userInput = {
        occasion: 'Summer vibes',
        brandConnection: 'Perfect for summer',
        targetAudience: 'seasonal shoppers'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.autoFilledFields.postGoal).toBe('storytelling');
      expect(result.autoFilledFields.imageDescription).toContain('Summer vibes');
    });
  });

  describe('Brand Data Integration', () => {
    test('prompts should include brand name', () => {
      const template = getTemplateById('product_photo')!;
      const userInput = {
        productDescription: 'Test product',
        backgroundStyle: 'White/Clean'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Test Brand');
    });

    test('prompts should include brand description', () => {
      const template = getTemplateById('hero_banner')!;
      const userInput = {
        keyMessage: 'Test message',
        mood: 'Professional'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('modern tech company');
    });

    test('prompts should include industry', () => {
      const template = getTemplateById('product_photo')!;
      const userInput = {
        productDescription: 'Test product',
        backgroundStyle: 'White/Clean'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Technology');
    });

    test('prompts should include brand visual style', () => {
      const template = getTemplateById('product_photo')!;
      const userInput = {
        productDescription: 'Test product',
        backgroundStyle: 'White/Clean'
      };

      const result = buildTemplatePrompt(template, mockBrandData, userInput);

      expect(result.finalPrompt).toContain('Clean, minimalist aesthetic');
    });
  });

  describe('Template Specific Features', () => {
    test('product photo should support different backgrounds', () => {
      const template = getTemplateById('product_photo')!;

      const whiteBackground = buildTemplatePrompt(template, mockBrandData, {
        productDescription: 'Test',
        backgroundStyle: 'White/Clean'
      });
      expect(whiteBackground.finalPrompt).toContain('clean white background');

      const naturalBackground = buildTemplatePrompt(template, mockBrandData, {
        productDescription: 'Test',
        backgroundStyle: 'Natural/Lifestyle'
      });
      expect(naturalBackground.finalPrompt).toContain('natural lifestyle');

      const darkBackground = buildTemplatePrompt(template, mockBrandData, {
        productDescription: 'Test',
        backgroundStyle: 'Dark/Dramatic'
      });
      expect(darkBackground.finalPrompt).toContain('dark moody');
    });

    test('testimonial card should handle optional client name', () => {
      const template = getTemplateById('testimonial_card')!;

      const withName = buildTemplatePrompt(template, mockBrandData, {
        testimonialText: 'Great product!',
        clientName: 'John D.'
      });
      expect(withName.finalPrompt).toContain('Great product!');

      const withoutName = buildTemplatePrompt(template, mockBrandData, {
        testimonialText: 'Great product!',
        clientName: ''
      });
      expect(withoutName.finalPrompt).toContain('Great product!');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing user input gracefully', () => {
      const template = getTemplateById('product_photo')!;
      const emptyInput = {
        productDescription: '',
        backgroundStyle: 'White/Clean'
      };

      const result = buildTemplatePrompt(template, mockBrandData, emptyInput);

      // Should use placeholder text
      expect(result.finalPrompt).toContain('the product');
    });

    test('should handle incomplete brand data', () => {
      const incompleteBrandData: BrandData = {
        ...mockBrandData,
        brandName: '',
        brandDescription: '',
        industry: ''
      };

      const template = getTemplateById('product_photo')!;
      const userInput = {
        productDescription: 'Test product',
        backgroundStyle: 'White/Clean'
      };

      const result = buildTemplatePrompt(template, incompleteBrandData, userInput);

      // Should still generate a prompt with fallbacks
      expect(result.finalPrompt).toBeDefined();
      expect(result.finalPrompt.length).toBeGreaterThan(0);
    });
  });
});
