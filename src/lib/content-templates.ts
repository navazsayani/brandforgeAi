/**
 * Content Studio Templates - Phase 1 MVP
 *
 * Universal templates that work for all industries and user types.
 * Templates provide composition patterns, NOT content replacements.
 * User's brand data is ALWAYS preserved and merged into final prompts.
 */

import type { BrandData } from '@/types';

export interface ContentTemplate {
  // Metadata
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'image' | 'social';

  // Industry filtering (null = universal, works for all)
  industries: string[] | null;

  // Image mode suggestion (for templates that work better with enhance mode)
  suggestedImageMode?: 'reference' | 'enhance';

  // Composition presets (technical settings, NOT brand content)
  presets: {
    // Image generation presets
    imageStyle?: string;
    aspectRatio?: string;
    compositionGuide?: string;
    technicalNotes?: string;

    // Social post presets
    tone?: string;
    platform?: string;
    postGoal?: string;
  };

  // What user must provide (NOT pre-filled)
  requiredUserInputs: {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'textarea' | 'select';
    options?: string[];
    maxLength?: number;
  }[];

  // Example preview (for UI)
  exampleImage?: string;
  estimatedTime: string;
  premium: boolean;

  // Use case tags for filtering
  tags: string[];
}

export interface TemplatePromptBuilderResult {
  finalPrompt: string;
  autoFilledFields: {
    imageStyle?: string;
    aspectRatio?: string;
    customStyleNotes?: string;
    negativePrompt?: string;
    // Social fields
    tone?: string;
    platform?: string;
    postGoal?: string;
    targetAudience?: string;
    callToAction?: string;
    imageDescription?: string;
  };
}

/**
 * Build final prompt by merging user's brand data + template structure + user input
 * CRITICAL: This function NEVER modifies userBrandData (read-only)
 */
export function buildTemplatePrompt(
  template: ContentTemplate,
  userBrandData: BrandData,
  userInput: Record<string, string>
): TemplatePromptBuilderResult {

  if (template.category === 'image') {
    return buildImagePrompt(template, userBrandData, userInput);
  } else {
    return buildSocialPrompt(template, userBrandData, userInput);
  }
}

function buildImagePrompt(
  template: ContentTemplate,
  userBrandData: BrandData,
  userInput: Record<string, string>
): TemplatePromptBuilderResult {

  const compositionGuide = template.presets.compositionGuide || '';
  const technicalNotes = template.presets.technicalNotes || '';

  // Build custom style notes based on user input and template
  let customStyleNotes = '';

  // Template-specific prompt building
  switch (template.id) {
    case 'product_photo':
      const backgroundStyle = userInput.backgroundStyle === 'natural'
        ? 'natural lifestyle setting with complementary props and soft lighting'
        : userInput.backgroundStyle === 'dark'
        ? 'dark moody background with dramatic lighting'
        : 'clean white background with studio lighting';

      customStyleNotes = `Professional product photography, ${backgroundStyle}, centered composition`;

      const finalPrompt = `
Professional product photography of: ${userInput.productDescription || 'the product'}

**BRAND CONTEXT:**
Brand: ${userBrandData.brandName || 'your brand'}
Description: ${userBrandData.brandDescription || ''}
Industry: ${userBrandData.industry || ''}
Brand visual style: ${userBrandData.imageStyleNotes || 'Professional, high-quality aesthetic'}

**COMPOSITION:**
${compositionGuide}
Background: ${backgroundStyle}
Product positioning: Centered, hero product focus
Detail focus: Sharp focus on product, highlight key features and textures

**TECHNICAL SPECS:**
${technicalNotes}

**BRAND ALIGNMENT:**
Ensure the image reflects ${userBrandData.brandName || 'the brand'}'s identity and visual style.
Maintain consistency with: ${userBrandData.imageStyleNotes || 'professional aesthetic'}
      `.trim();

      return {
        finalPrompt,
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'blurry, low quality, watermark, distorted product, bad lighting'
        }
      };

    case 'hero_banner':
      customStyleNotes = `Hero banner composition, ${userInput.mood || 'professional'} mood, wide format, impactful visual`;

      return {
        finalPrompt: `
Create a compelling hero banner image for: ${userBrandData.brandName || 'the brand'}

**BRAND & MESSAGE:**
Brand: ${userBrandData.brandName || 'your brand'}
Description: ${userBrandData.brandDescription || ''}
Key message: ${userInput.keyMessage || 'Professional brand presence'}
Mood: ${userInput.mood || 'Professional and engaging'}

**COMPOSITION:**
${compositionGuide}
Visual hierarchy: Strong focal point, clear message support
Composition: Rule of thirds, balanced, professional
Space: Leave room for text overlay (headline/CTA)

**BRAND STYLE:**
${userBrandData.imageStyleNotes || 'Professional, high-quality aesthetic'}

**TECHNICAL:**
${technicalNotes}
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, busy, poor composition, amateur'
        }
      };

    case 'quote_graphic':
      customStyleNotes = `Quote graphic design, ${userInput.visualStyle || 'minimal'} aesthetic, typography-focused`;

      return {
        finalPrompt: `
Create an inspiring quote graphic with the following quote:

"${userInput.quote || 'Your inspiring quote here'}"

**BRAND CONTEXT:**
Brand: ${userBrandData.brandName || 'your brand'}
Visual style: ${userBrandData.imageStyleNotes || 'Professional, high-quality aesthetic'}
Industry: ${userBrandData.industry || ''}

**DESIGN APPROACH:**
Style: ${userInput.visualStyle || 'Minimalist and clean'}
${compositionGuide}
Typography: Bold, readable, professionally designed
Visual elements: Subtle brand-aligned graphics or patterns
Background: Clean, not distracting from text

**REQUIREMENTS:**
- Text must be clearly readable
- Professional, social-media ready design
- Align with brand's visual identity
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'illegible text, cluttered, amateur design, poor typography'
        }
      };

    case 'behind_scenes':
      customStyleNotes = `Behind-the-scenes authentic moment, relatable, engaging`;

      return {
        finalPrompt: `
Create a behind-the-scenes image showing:

Scene: ${userInput.sceneDescription || 'behind-the-scenes moment'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Industry: ${userBrandData.industry || ''}
Style: ${userBrandData.imageStyleNotes || 'Authentic, professional'}

**APPROACH:**
${compositionGuide}
Authenticity: Real, relatable moment
Professionalism: Still maintains quality
Storytelling: Shows process, effort, human side
Engagement: Makes audience feel connected

**MOOD:**
Authentic, approachable, professional
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'staged, fake, overly polished, disconnected'
        }
      };

    case 'flat_lay':
      customStyleNotes = `Flat lay composition, overhead view, organized aesthetic`;

      return {
        finalPrompt: `
Create a flat lay composition featuring:

Items: ${userInput.items || 'brand-related items'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Style: ${userBrandData.imageStyleNotes || 'Professional aesthetic'}
Industry: ${userBrandData.industry || ''}

**COMPOSITION:**
${compositionGuide}
Overhead view: Directly from above
Arrangement: Thoughtfully organized, aesthetically pleasing
Background: Clean, complementary surface
Styling: Professional, Instagram-worthy

**AESTHETIC:**
Clean, organized, visually appealing
Maintains brand visual identity
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, messy, poor lighting, amateur'
        }
      };

    case 'process_shot':
      customStyleNotes = `Process/how-to visual, educational, step-by-step`;

      return {
        finalPrompt: `
Create a process/how-to image showing:

Process: ${userInput.processDescription || 'the process or technique'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Industry: ${userBrandData.industry || ''}
Style: ${userBrandData.imageStyleNotes || 'Professional, educational'}

**APPROACH:**
${compositionGuide}
Educational: Clear demonstration of process
Professional: High-quality, expert presentation
Engaging: Makes process look accessible
Detail: Shows important steps or techniques

**PURPOSE:**
Demonstrate expertise
Educational value
Build trust and authority
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'unclear, confusing, unprofessional, poor detail'
        }
      };

    case 'social_story':
      customStyleNotes = `Instagram/Facebook Story format, vertical, engaging`;

      return {
        finalPrompt: `
Create a social media story image (vertical format) for:

Content: ${userInput.storyContent || 'engaging story content'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Style: ${userBrandData.imageStyleNotes || 'Engaging, professional'}

**COMPOSITION:**
${compositionGuide}
Vertical format: Optimized for Stories/Reels
Visual hierarchy: Key content in safe zones (avoid top/bottom edges)
Engaging: Stops scrolling, captures attention
Mobile-optimized: Looks great on phone screens

**REQUIREMENTS:**
- Vertical 9:16 format
- Content in safe zones
- Engaging and scroll-stopping
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: '9:16',
          customStyleNotes,
          negativePrompt: 'horizontal format, poor mobile optimization, boring'
        }
      };

    case 'lifestyle_scene':
      customStyleNotes = `Lifestyle photography, authentic context, relatable`;

      return {
        finalPrompt: `
Create a lifestyle scene showing:

${userInput.contextDescription || 'product or service in authentic use context'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Industry: ${userBrandData.industry || ''}
Style: ${userBrandData.imageStyleNotes || 'Authentic, relatable aesthetic'}

**APPROACH:**
${compositionGuide}
Context: Real-life setting, authentic moment
Relatable: Audience can see themselves in this scene
Professional: High-quality but not overly staged
Aspirational: Attractive lifestyle representation

**MOOD:**
Natural, authentic, relatable, aspirational
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'staged, fake, disconnected, unrealistic'
        }
      };

    case 'collage_grid':
      customStyleNotes = `Product collage, grid layout, organized aesthetic`;

      return {
        finalPrompt: `
Create a stylish collage or grid featuring:

${userInput.itemsToFeature || 'multiple products or items'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Style: ${userBrandData.imageStyleNotes || 'Professional, organized aesthetic'}

**COMPOSITION:**
${compositionGuide}
Grid layout: Organized, balanced arrangement
Visual variety: Showcases multiple items attractively
Professional: High-quality presentation
Cohesive: Feels unified despite multiple elements

**AESTHETIC:**
Clean, organized, visually appealing
Maintains brand visual identity
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, messy, disorganized, unprofessional'
        }
      };

    case 'team_introduction':
      customStyleNotes = `Professional team photography, ${userInput.mood || 'professional'} atmosphere, authentic and approachable`;

      return {
        finalPrompt: `
Create a professional team introduction image:

Team/Person Context: ${userInput.teamContext || 'team members'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Industry: ${userBrandData.industry || ''}
Style: ${userBrandData.imageStyleNotes || 'Professional, authentic aesthetic'}

**COMPOSITION:**
${compositionGuide}
Atmosphere: ${userInput.mood || 'Professional and approachable'}
Setting: Professional office or branded environment
People: Natural expressions, confident posture, relatable
Lighting: Professional, flattering, warm

**MOOD:**
${userInput.mood || 'Professional'}, trustworthy, authentic, human connection
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'stiff, awkward, unprofessional, poor lighting, artificial'
        }
      };

    case 'announcement_card':
      customStyleNotes = `Announcement graphic, ${userInput.urgency || 'exciting'} visual style, bold and attention-grabbing`;

      return {
        finalPrompt: `
Create an eye-catching announcement card:

Announcement: ${userInput.announcementType || 'important update'}
Urgency: ${userInput.urgency || 'Exciting News'}

**BRAND:**
${userBrandData.brandName || 'Your brand'}
Style: ${userBrandData.imageStyleNotes || 'Professional, engaging aesthetic'}

**COMPOSITION:**
${compositionGuide}
Design: Bold, clear visual hierarchy
Colors: High contrast, attention-grabbing
Space: Leave room for text overlay
Impact: Scroll-stopping, shareable

**BRAND ALIGNMENT:**
Maintain ${userBrandData.brandName || 'brand'} visual identity
Professional yet engaging presentation
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, illegible, dull, boring, unprofessional'
        }
      };

    default:
      return {
        finalPrompt: '',
        autoFilledFields: {}
      };
  }
}

function buildSocialPrompt(
  template: ContentTemplate,
  userBrandData: BrandData,
  userInput: Record<string, string>
): TemplatePromptBuilderResult {

  // Template-specific prompt building for social posts
  switch (template.id) {
    case 'product_launch':
      return {
        finalPrompt: '', // Social prompts handled by existing flow
        autoFilledFields: {
          postGoal: 'promotion',
          tone: 'professional',
          targetAudience: userInput.targetAudience || '',
          callToAction: userInput.callToAction || 'Check it out!',
          imageDescription: userInput.productName
            ? `Product launch announcement for ${userInput.productName}`
            : ''
        }
      };

    case 'quick_tip':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'informational',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'followers seeking valuable tips',
          imageDescription: userInput.tipTopic
            ? `Quick tip about ${userInput.tipTopic}`
            : ''
        }
      };

    case 'question_post':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'engagement',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'engaged community members',
          callToAction: 'Share your thoughts in the comments!'
        }
      };

    case 'milestone':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'community_building',
          tone: 'inspirational',
          targetAudience: userInput.targetAudience || 'our amazing community',
          callToAction: 'Thank you for being part of our journey!'
        }
      };

    case 'user_spotlight':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'community_building',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'our community',
          imageDescription: userInput.userName
            ? `User spotlight featuring ${userInput.userName}`
            : 'User spotlight and testimonial'
        }
      };

    case 'tutorial_howto':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'informational',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'people who want to learn',
          imageDescription: userInput.tutorialTopic
            ? `Tutorial about ${userInput.tutorialTopic}`
            : 'Step-by-step tutorial'
        }
      };

    case 'contest_giveaway':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'promotion',
          tone: 'professional',
          targetAudience: userInput.targetAudience || 'potential participants',
          callToAction: userInput.entryMethod || 'Enter to win!'
        }
      };

    case 'seasonal_timely':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'storytelling',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'seasonal shoppers',
          imageDescription: userInput.occasion
            ? `Seasonal post for ${userInput.occasion}`
            : 'Seasonal or timely content'
        }
      };

    case 'customer_review_post':
      return {
        finalPrompt: '',
        autoFilledFields: {
          postGoal: 'community_building',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'potential customers',
          imageDescription: userInput.customerName
            ? `Customer review from ${userInput.customerName}`
            : 'Customer review and testimonial'
        }
      };

    default:
      return {
        finalPrompt: '',
        autoFilledFields: {}
      };
  }
}

// ============================================
// UNIVERSAL TEMPLATES (23 total - optimized for quality AI output)
// ============================================

export const contentTemplates: ContentTemplate[] = [
  // IMAGE GENERATION TEMPLATES (14)
  {
    id: 'product_photo',
    name: 'Product Photo',
    icon: '📦',
    description: 'Professional product photography for e-commerce and social media',
    category: 'image',
    industries: null, // Universal
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '1:1',
      compositionGuide: 'Professional product photography composition with centered subject and clean presentation',
      technicalNotes: 'High-resolution, commercial-quality photography with proper lighting and focus'
    },
    requiredUserInputs: [
      {
        key: 'productDescription',
        label: 'Describe your product',
        placeholder: 'e.g., Organic lavender body butter in glass jar',
        type: 'text',
        maxLength: 200
      },
      {
        key: 'backgroundStyle',
        label: 'Background preference',
        placeholder: 'Select background',
        type: 'select',
        options: ['White/Clean', 'Natural/Lifestyle', 'Dark/Dramatic']
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['product', 'ecommerce', 'professional', 'marketing']
  },
  {
    id: 'hero_banner',
    name: 'Hero Banner',
    icon: '🎯',
    description: 'Eye-catching banner for website headers, ads, and landing pages',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '16:9',
      compositionGuide: 'Wide hero banner composition with strong focal point and space for text overlay',
      technicalNotes: 'Landscape format optimized for web headers and advertising'
    },
    requiredUserInputs: [
      {
        key: 'keyMessage',
        label: 'What message should this banner convey?',
        placeholder: 'e.g., Premium organic skincare for healthy skin',
        type: 'text',
        maxLength: 200
      },
      {
        key: 'mood',
        label: 'Visual mood',
        placeholder: 'Select mood',
        type: 'select',
        options: ['Professional', 'Warm & Inviting', 'Bold & Energetic', 'Calm & Serene', 'Luxurious']
      }
    ],
    estimatedTime: '45 seconds',
    premium: false,
    tags: ['web', 'header', 'advertising', 'landing page']
  },
  {
    id: 'quote_graphic',
    name: 'Quote Graphic',
    icon: '💬',
    description: 'Inspiring quote graphics for social media engagement',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'minimalist',
      aspectRatio: '1:1',
      compositionGuide: 'Clean typography-focused design with the quote as the hero element',
      technicalNotes: 'Readable text, professional typography, social media optimized'
    },
    requiredUserInputs: [
      {
        key: 'quote',
        label: 'Your quote',
        placeholder: 'e.g., Success is not final, failure is not fatal...',
        type: 'textarea',
        maxLength: 300
      },
      {
        key: 'visualStyle',
        label: 'Design style',
        placeholder: 'Select style',
        type: 'select',
        options: ['Minimalist', 'Bold Typography', 'Elegant', 'Modern Gradient', 'Natural/Organic']
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['quote', 'inspiration', 'engagement', 'social media']
  },
  {
    id: 'before_after',
    name: 'Before/After',
    icon: '↔️',
    description: 'Transformation showcase for results and impact',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '1:1',
      compositionGuide: 'Clear before/after split composition showing transformation',
      technicalNotes: 'Professional comparison layout with clear visual distinction'
    },
    requiredUserInputs: [
      {
        key: 'transformation',
        label: 'What transformation are you showcasing?',
        placeholder: 'e.g., Skin transformation after 4 weeks of using our serum',
        type: 'text',
        maxLength: 200
      }
    ],
    estimatedTime: '45 seconds',
    premium: false,
    tags: ['transformation', 'results', 'before-after', 'proof']
  },
  {
    id: 'testimonial_card',
    name: 'Testimonial Card',
    icon: '⭐',
    description: 'Social proof graphics featuring customer testimonials',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'minimalist',
      aspectRatio: '1:1',
      compositionGuide: 'Clean testimonial card design with quote and attribution',
      technicalNotes: 'Professional, trustworthy presentation with readable typography'
    },
    requiredUserInputs: [
      {
        key: 'testimonialText',
        label: 'Testimonial quote',
        placeholder: 'e.g., This product changed my life! Best purchase ever.',
        type: 'textarea',
        maxLength: 250
      },
      {
        key: 'clientName',
        label: 'Client name (optional)',
        placeholder: 'e.g., Sarah M.',
        type: 'text',
        maxLength: 50
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['testimonial', 'social proof', 'trust', 'review']
  },
  {
    id: 'promotional_badge',
    name: 'Promotional Badge',
    icon: '🏷️',
    description: 'Sale announcements, special offers, and promotional graphics',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'vibrant',
      aspectRatio: '1:1',
      compositionGuide: 'Bold, attention-grabbing promotional design',
      technicalNotes: 'Clear messaging, eye-catching, conversion-focused'
    },
    requiredUserInputs: [
      {
        key: 'offer',
        label: 'Your offer',
        placeholder: 'e.g., 30% OFF',
        type: 'text',
        maxLength: 50
      },
      {
        key: 'offerDetails',
        label: 'Offer details (optional)',
        placeholder: 'e.g., Limited time only - ends Sunday',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['sale', 'promotion', 'offer', 'discount']
  },
  {
    id: 'behind_scenes',
    name: 'Behind-the-Scenes',
    icon: '🎬',
    description: 'Authentic behind-the-scenes moments to build connection. Upload your BTS photo for professional quality!',
    category: 'image',
    industries: null,
    suggestedImageMode: 'enhance', // AI Photoshoot: Transforms casual BTS photos into professional marketing content
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '4:5',
      compositionGuide: 'Authentic, candid moment showing the human side of your brand',
      technicalNotes: 'Natural, relatable, professional quality'
    },
    requiredUserInputs: [
      {
        key: 'sceneDescription',
        label: 'What behind-the-scenes moment?',
        placeholder: 'e.g., Packing orders in our studio',
        type: 'text',
        maxLength: 200
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['authentic', 'bts', 'connection', 'story']
  },
  {
    id: 'flat_lay',
    name: 'Flat Lay',
    icon: '📐',
    description: 'Stylish overhead composition for lifestyle branding',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '1:1',
      compositionGuide: 'Overhead flat lay composition with thoughtfully arranged items',
      technicalNotes: 'Clean, organized, aesthetically pleasing arrangement'
    },
    requiredUserInputs: [
      {
        key: 'items',
        label: 'What items to feature?',
        placeholder: 'e.g., Our skincare products with flowers and natural elements',
        type: 'text',
        maxLength: 200
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['lifestyle', 'flat lay', 'aesthetic', 'instagram']
  },
  {
    id: 'process_shot',
    name: 'Process Shot',
    icon: '🔧',
    description: 'Show your expertise through process and how-to visuals',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '4:5',
      compositionGuide: 'Educational process demonstration showing expertise',
      technicalNotes: 'Clear, detailed, professional presentation'
    },
    requiredUserInputs: [
      {
        key: 'processDescription',
        label: 'What process are you showing?',
        placeholder: 'e.g., Hand-pouring our artisan candles',
        type: 'text',
        maxLength: 200
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['how-to', 'process', 'expertise', 'educational']
  },
  {
    id: 'social_story',
    name: 'Social Story',
    icon: '📱',
    description: 'Vertical format optimized for Instagram/Facebook Stories',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'vibrant',
      aspectRatio: '9:16',
      compositionGuide: 'Vertical story format with content in safe zones',
      technicalNotes: 'Mobile-optimized, engaging, scroll-stopping'
    },
    requiredUserInputs: [
      {
        key: 'storyContent',
        label: 'What is your story about?',
        placeholder: 'e.g., New product sneak peek',
        type: 'text',
        maxLength: 200
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['story', 'instagram', 'facebook', 'vertical', 'mobile']
  },
  {
    id: 'lifestyle_scene',
    name: 'Lifestyle Scene',
    icon: '🌿',
    description: 'Product or service in real-life context to show use case. Upload your lifestyle photo for professional transformation!',
    category: 'image',
    industries: null,
    suggestedImageMode: 'enhance', // AI Photoshoot: Transforms casual lifestyle photos into marketing-ready images
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '4:5',
      compositionGuide: 'Natural lifestyle setting showing product/service in authentic use',
      technicalNotes: 'Relatable, aspirational, authentic lifestyle photography'
    },
    requiredUserInputs: [
      {
        key: 'contextDescription',
        label: 'Describe the lifestyle scene',
        placeholder: 'e.g., Morning coffee routine with our organic blend on a kitchen counter',
        type: 'text',
        maxLength: 250
      }
    ],
    estimatedTime: '35 seconds',
    premium: false,
    tags: ['lifestyle', 'context', 'authentic', 'relatable']
  },
  {
    id: 'event_announcement',
    name: 'Event Announcement',
    icon: '🎪',
    description: 'Eye-catching graphics for events, webinars, or launches',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'vibrant',
      aspectRatio: '1:1',
      compositionGuide: 'Bold event announcement design with clear visual hierarchy',
      technicalNotes: 'Attention-grabbing, clear messaging, shareable'
    },
    requiredUserInputs: [
      {
        key: 'eventName',
        label: 'Event name',
        placeholder: 'e.g., Summer Sale Kickoff, Live Product Demo',
        type: 'text',
        maxLength: 100
      },
      {
        key: 'eventDetails',
        label: 'Key details (date/time optional)',
        placeholder: 'e.g., This Friday at 2PM EST',
        type: 'text',
        maxLength: 150
      }
    ],
    estimatedTime: '35 seconds',
    premium: false,
    tags: ['event', 'announcement', 'webinar', 'launch']
  },
  // SOCIAL POST TEMPLATES (9 - optimized for quality AI output)
  {
    id: 'product_launch',
    name: 'Product Launch',
    icon: '🚀',
    description: 'Announce new products or services with excitement',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'promotion',
      tone: 'professional',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'productName',
        label: 'Product/service name',
        placeholder: 'e.g., Lavender Dream Body Butter',
        type: 'text',
        maxLength: 100
      },
      {
        key: 'targetAudience',
        label: 'Target audience',
        placeholder: 'e.g., skincare enthusiasts',
        type: 'text',
        maxLength: 100
      },
      {
        key: 'callToAction',
        label: 'Call to action',
        placeholder: 'e.g., Shop now, Learn more',
        type: 'text',
        maxLength: 50
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['launch', 'product', 'announcement', 'promotion']
  },
  {
    id: 'quick_tip',
    name: 'Quick Tip',
    icon: '💡',
    description: 'Share valuable tips and expertise with your audience',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'informational',
      tone: 'friendly',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'tipTopic',
        label: 'What is your tip about?',
        placeholder: 'e.g., skincare routine, productivity hack',
        type: 'text',
        maxLength: 100
      },
      {
        key: 'targetAudience',
        label: 'Who is this tip for?',
        placeholder: 'e.g., busy professionals, beginners',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['tip', 'educational', 'value', 'expertise']
  },
  {
    id: 'question_post',
    name: 'Question Post',
    icon: '❓',
    description: 'Ask engaging questions to boost interaction',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'engagement',
      tone: 'friendly',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'questionTopic',
        label: 'What topic is your question about?',
        placeholder: 'e.g., favorite products, daily routines, preferences',
        type: 'text',
        maxLength: 200
      },
      {
        key: 'targetAudience',
        label: 'Who are you asking?',
        placeholder: 'e.g., our community, fellow entrepreneurs',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '20 seconds',
    premium: false,
    tags: ['engagement', 'question', 'community', 'interaction']
  },
  {
    id: 'milestone',
    name: 'Milestone Celebration',
    icon: '🎉',
    description: 'Celebrate achievements and thank your community',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'community_building',
      tone: 'inspirational',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'milestoneDescription',
        label: 'What milestone are you celebrating?',
        placeholder: 'e.g., 10k followers, 1 year in business, 1000 customers',
        type: 'text',
        maxLength: 150
      },
      {
        key: 'targetAudience',
        label: 'Who are you thanking?',
        placeholder: 'e.g., our amazing community, loyal customers',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['milestone', 'celebration', 'gratitude', 'community']
  },
  {
    id: 'user_spotlight',
    name: 'User Spotlight',
    icon: '👤',
    description: 'Feature customers/clients to build community',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'community_building',
      tone: 'friendly',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'userName',
        label: 'Who are you featuring?',
        placeholder: 'e.g., Sarah from our community',
        type: 'text',
        maxLength: 100
      },
      {
        key: 'userStory',
        label: 'Brief story or achievement',
        placeholder: 'e.g., Amazing results after 3 months',
        type: 'text',
        maxLength: 200
      },
      {
        key: 'targetAudience',
        label: 'Who will relate to this?',
        placeholder: 'e.g., aspiring entrepreneurs, new customers',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['spotlight', 'user', 'community', 'testimonial']
  },
  {
    id: 'tutorial_howto',
    name: 'Tutorial/How-To',
    icon: '📚',
    description: 'Share step-by-step guidance and demonstrate expertise',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'informational',
      tone: 'friendly',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'tutorialTopic',
        label: 'What are you teaching?',
        placeholder: 'e.g., How to choose the right product for your skin type',
        type: 'text',
        maxLength: 150
      },
      {
        key: 'targetAudience',
        label: 'Who is this for?',
        placeholder: 'e.g., beginners, DIY enthusiasts',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['tutorial', 'how-to', 'educational', 'guide']
  },
  {
    id: 'contest_giveaway',
    name: 'Contest/Giveaway',
    icon: '🎁',
    description: 'Announce contests to drive engagement and growth',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'promotion',
      tone: 'professional',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'contestPrize',
        label: 'What is the prize?',
        placeholder: 'e.g., $100 gift card, Free product bundle',
        type: 'text',
        maxLength: 150
      },
      {
        key: 'entryMethod',
        label: 'How to enter (optional)?',
        placeholder: 'e.g., Like and comment, Tag a friend, Share this post',
        type: 'text',
        maxLength: 150
      },
      {
        key: 'targetAudience',
        label: 'Target audience',
        placeholder: 'e.g., our followers, new audience',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '35 seconds',
    premium: false,
    tags: ['contest', 'giveaway', 'engagement', 'growth']
  },
  {
    id: 'seasonal_timely',
    name: 'Seasonal/Timely Post',
    icon: '🎃',
    description: 'Capitalize on holidays, seasons, and trending moments',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'storytelling',
      tone: 'friendly',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'occasion',
        label: 'What occasion or season?',
        placeholder: 'e.g., Summer vibes, Holiday season, Back to school',
        type: 'text',
        maxLength: 100
      },
      {
        key: 'brandConnection',
        label: 'How does it relate to your brand?',
        placeholder: 'e.g., Perfect gift for the season, Summer essentials',
        type: 'text',
        maxLength: 200
      },
      {
        key: 'targetAudience',
        label: 'Target audience',
        placeholder: 'e.g., seasonal shoppers, gift buyers',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['seasonal', 'timely', 'holiday', 'trending']
  },

  // NEW ADDITIONS - AI-capable templates for quality output
  {
    id: 'team_introduction',
    name: 'Team Introduction',
    icon: '👥',
    description: 'Showcase your team members to humanize your brand. Upload your team photo for professional photoshoot transformation!',
    category: 'image',
    industries: null,
    suggestedImageMode: 'enhance', // AI Photoshoot: Transforms uploaded team photos into professional marketing images
    presets: {
      imageStyle: 'photorealistic',
      aspectRatio: '4:5',
      compositionGuide: 'Professional team photo or individual portrait with warm, approachable atmosphere',
      technicalNotes: 'Professional quality, natural expressions, office or branded background'
    },
    requiredUserInputs: [
      {
        key: 'teamContext',
        label: 'Describe the team or person',
        placeholder: 'e.g., Our founder working in the studio, Meet our creative team',
        type: 'text',
        maxLength: 200
      },
      {
        key: 'mood',
        label: 'Atmosphere',
        placeholder: 'Select mood',
        type: 'select',
        options: ['Professional', 'Friendly & Approachable', 'Creative & Dynamic', 'Warm & Inviting']
      }
    ],
    estimatedTime: '35 seconds',
    premium: false,
    tags: ['team', 'about us', 'people', 'trust', 'authentic']
  },
  {
    id: 'announcement_card',
    name: 'Announcement Card',
    icon: '📢',
    description: 'Eye-catching announcement graphics for updates, alerts, and news',
    category: 'image',
    industries: null,
    presets: {
      imageStyle: 'vibrant',
      aspectRatio: '1:1',
      compositionGuide: 'Bold, attention-grabbing design with clear focal point for text overlay',
      technicalNotes: 'High contrast, readable, social media optimized'
    },
    requiredUserInputs: [
      {
        key: 'announcementType',
        label: 'What are you announcing?',
        placeholder: 'e.g., New product arriving, Store hours change, Important update',
        type: 'text',
        maxLength: 150
      },
      {
        key: 'urgency',
        label: 'Urgency level',
        placeholder: 'Select urgency',
        type: 'select',
        options: ['Exciting News', 'Important Update', 'Urgent Alert', 'Coming Soon']
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['announcement', 'news', 'alert', 'update', 'info']
  },
  {
    id: 'customer_review_post',
    name: 'Customer Review Post',
    icon: '⭐',
    description: 'Share authentic customer reviews and testimonials to build trust',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'community_building',
      tone: 'friendly',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'reviewHighlight',
        label: 'Review highlight or main feedback',
        placeholder: 'e.g., Customers love our fast shipping and quality products',
        type: 'textarea',
        maxLength: 300
      },
      {
        key: 'customerName',
        label: 'Customer name (optional)',
        placeholder: 'e.g., Sarah M., John D.',
        type: 'text',
        maxLength: 50
      },
      {
        key: 'targetAudience',
        label: 'Who will relate to this?',
        placeholder: 'e.g., potential customers, similar buyers',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['review', 'testimonial', 'social proof', 'trust', 'customer']
  }
];

// Helper functions
export function getUniversalTemplates(): ContentTemplate[] {
  return contentTemplates.filter(t => t.industries === null);
}

export function getTemplatesByCategory(category: 'image' | 'social'): ContentTemplate[] {
  return contentTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): ContentTemplate | undefined {
  return contentTemplates.find(t => t.id === id);
}

export function getTemplatesForUser(userIndustry: string | null): ContentTemplate[] {
  return contentTemplates.filter(template =>
    template.industries === null || // Universal templates
    (userIndustry && template.industries?.includes(userIndustry)) // Industry match
  );
}
