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
      // Determine background-specific scene and lighting
      let backgroundScene = '';
      let backgroundLighting = '';
      const bgStyle = userInput.backgroundStyle;

      if (bgStyle === 'Natural/Lifestyle') {
        backgroundScene = 'natural lifestyle setting with carefully selected complementary props creating context and story';
        backgroundLighting = 'Soft, diffused natural window light from 45-degree angle creating gentle shadows and highlighting product textures. Warm, inviting illumination with subtle fill light eliminating harsh shadows';
      } else if (bgStyle === 'Dark/Dramatic') {
        backgroundScene = 'dark, moody background with rich blacks and dramatic contrast emphasizing product premium quality';
        backgroundLighting = 'Dramatic studio lighting with strong directional key light creating bold highlights and deep shadows. Rim lighting outlining product edges, creating separation from background and adding luxury appeal';
      } else {
        backgroundScene = 'pristine white seamless background creating clean, professional e-commerce presentation';
        backgroundLighting = 'Professional studio lighting with main key light and fill lights creating even, shadow-free illumination. Bright, clean lighting showcasing every product detail with commercial clarity';
      }

      customStyleNotes = `Professional product photography, ${backgroundScene}, centered composition`;

      const finalPrompt = `
A photorealistic commercial product photograph of: ${userInput.productDescription || 'the product'}

**SCENE DESCRIPTION:**
Subject: ${userInput.productDescription || 'the product'} as hero element, meticulously styled and positioned
Setting: ${backgroundScene}
Composition: Centered product placement in square format (1:1) with balanced visual weight. Product occupies 60-70% of frame, allowing breathing room around edges
Styling: Professional commercial styling showcasing product's best features, key details prominently visible

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Slightly elevated three-quarter view providing dimensional perspective and showing multiple product facets
Lens: Macro or medium telephoto (85-100mm equivalent) ensuring sharp detail and natural product proportions without distortion
Lighting: ${backgroundLighting}
Depth of Field: Deep focus (f/8-f/11 equivalent) keeping entire product sharp from front to back, with background appropriately rendered based on style choice

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Professional, high-quality aesthetic'}

**VISUAL EXECUTION:**
Color Palette: Accurate product color representation aligned with brand aesthetic
Textures: Razor-sharp detail showing material quality, surface textures, and craftsmanship
Product Features: Key features, labels, and unique selling points clearly visible and highlighted
Atmosphere: Professional, trustworthy, and appropriate for e-commerce and marketing use

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Square (1:1), centered product composition
Product Positioning: Centered hero placement with even negative space
Detail Emphasis: Sharp focus on product features, textures, and quality indicators

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: E-commerce and marketing grade, suitable for product listings and advertising
Resolution: High detail showing material quality and craftsmanship
Color Accuracy: True-to-life product colors for accurate customer expectations
Cultural Sensitivity: Appropriate and inclusive product presentation

**OUTPUT REQUIREMENTS:**
The final image must showcase ${userInput.productDescription || 'the product'} with commercial photography quality, accurate color representation, and professional styling that reflects brand identity. Product must be sharply focused, well-lit, and presented to maximize appeal and trust.
      `.trim();

      return {
        finalPrompt,
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'blurry, low quality, watermark, distorted product, bad lighting, soft focus, poor composition, amateur styling, inaccurate colors, cluttered background'
        }
      };

    case 'hero_banner':
      // Determine industry-specific scene guidance
      let industryScene = '';
      const industry = userBrandData.industry?.toLowerCase() || '';
      if (industry.includes('fashion') || industry.includes('apparel') || industry.includes('clothing')) {
        industryScene = 'elegant fashion setting with premium fabrics and sophisticated styling';
      } else if (industry.includes('food') || industry.includes('restaurant') || industry.includes('culinary')) {
        industryScene = 'artfully styled culinary presentation with appetizing lighting and complementary props';
      } else if (industry.includes('tech') || industry.includes('software') || industry.includes('digital')) {
        industryScene = 'modern, clean workspace with contemporary design elements and professional atmosphere';
      } else {
        industryScene = 'professional commercial setting that communicates quality and expertise';
      }

      // Determine mood-specific lighting and atmosphere
      let moodLighting = '';
      const mood = userInput.mood || 'Professional';
      if (mood === 'Warm & Inviting') {
        moodLighting = 'Soft, warm golden-hour lighting with gentle shadows creating an inviting, comfortable atmosphere. Natural sunlight filtering through, creating a welcoming ambiance';
      } else if (mood === 'Bold & Energetic') {
        moodLighting = 'Dynamic, high-contrast lighting with vibrant highlights creating an energetic, exciting atmosphere. Strong directional light adding drama and visual impact';
      } else if (mood === 'Calm & Serene') {
        moodLighting = 'Soft, diffused natural lighting with minimal shadows creating a peaceful, tranquil atmosphere. Even, gentle illumination promoting relaxation';
      } else if (mood === 'Luxurious') {
        moodLighting = 'Sophisticated studio lighting with subtle rim lights creating an elegant, premium atmosphere. Carefully balanced lighting emphasizing quality and refinement';
      } else {
        moodLighting = 'Professional studio lighting with balanced highlights and shadows creating a polished, trustworthy atmosphere. Clean, even illumination showcasing professionalism';
      }

      customStyleNotes = `Hero banner composition, ${mood} mood, wide format, impactful visual`;

      return {
        finalPrompt: `
A photorealistic wide-angle hero banner photograph with text overlay showcasing: ${userInput.keyMessage || 'Professional brand presence'}

**SCENE DESCRIPTION:**
Subject: ${userInput.keyMessage || 'Professional brand presence'} presented in ${industryScene}
Setting: Wide landscape composition (16:9 format) with professional text overlay integrated into the image
Composition: Rule of thirds placement with strong focal point in the left or right third, with headline text "${userInput.keyMessage || 'Professional brand presence'}" elegantly integrated into the composition
Text Integration: Professional headline text rendered directly on the image in modern, bold typography that complements the scene and brand aesthetic

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Eye-level perspective creating immediate viewer connection and engagement
Lens: Medium wide-angle (35mm equivalent) capturing expansive scene while maintaining natural proportions
Lighting: ${moodLighting}
Depth of Field: Selective focus with slightly softened background (f/4-f/5.6 equivalent) directing attention to primary subject while maintaining environmental context

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Professional, high-quality aesthetic'}

**TEXT OVERLAY REQUIREMENTS:**
Headline Text: "${userInput.keyMessage || 'Professional brand presence'}"
Typography: Modern, bold, highly readable sans-serif font
Text Placement: Positioned in area with good contrast, readable against background
Text Color: High contrast with background (white on dark areas, dark on light areas)
Text Style: Professional, clean, brand-appropriate styling
Legibility: Text must be clearly readable at all sizes

**VISUAL EXECUTION:**
Color Palette: Aligned with brand aesthetic, colors that support ${mood} mood with excellent text contrast
Textures: High detail showing quality and craftsmanship
Atmosphere: ${mood} mood pervading the entire scene
Visual Hierarchy: Text headline as primary focus, supported by compelling background imagery
Integration: Text and image work together as unified hero banner design

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Wide landscape (16:9), horizontal orientation
Layout: Asymmetrical balance with text integrated into composition
Visual Flow: Leading lines guiding eye to text headline
Text Zones: Text positioned where background provides good contrast and readability

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional marketing-grade, high resolution suitable for web headers
Format: Landscape orientation optimized for website banners and digital advertising
Text Quality: Sharp, crisp, perfectly legible text rendering
Cultural Sensitivity: Inclusive, appropriate, and respectful representation

**OUTPUT REQUIREMENTS:**
The final image must be a complete hero banner with the headline "${userInput.keyMessage || 'Professional brand presence'}" rendered as professional text overlay. Text must be highly readable, well-integrated into the design, and communicate the message with ${mood} tone while maintaining brand authenticity. The text and imagery should work together as a unified, professional hero banner ready for web use.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, busy, poor composition, amateur, centered subject, no space for text, chaotic, messy, low quality, portrait orientation, vertical format'
        }
      };

    case 'quote_graphic':
      // Determine visual style-specific design approach
      let quoteDesign = '';
      const visualStyle = userInput.visualStyle || 'Minimalist';

      if (visualStyle === 'Bold Typography') {
        quoteDesign = 'bold, impactful typography-focused design with strong typefaces and dramatic scale. Large, commanding letterforms creating visual power and statement';
      } else if (visualStyle === 'Elegant') {
        quoteDesign = 'refined, sophisticated design with elegant typography and subtle decorative elements. Graceful, timeless aesthetic emphasizing refinement and class';
      } else if (visualStyle === 'Modern Gradient') {
        quoteDesign = 'contemporary gradient background with modern typography overlay. Smooth color transitions creating depth and contemporary appeal';
      } else if (visualStyle === 'Natural/Organic') {
        quoteDesign = 'nature-inspired design with organic textures, earthy tones, and harmonious typography. Warm, authentic aesthetic connected to natural elements';
      } else {
        quoteDesign = 'clean, minimalist design with generous white space and refined typography. Simple, uncluttered aesthetic letting words speak with clarity';
      }

      customStyleNotes = `Quote graphic design, ${visualStyle} aesthetic, typography-focused`;

      return {
        finalPrompt: `
A photorealistic quote graphic design featuring the quote: "${userInput.quote || 'Your inspiring quote here'}"

**SCENE DESCRIPTION:**
Subject: Inspirational quote presented as professional graphic design for social media engagement
Setting: Square format (1:1) with ${quoteDesign}
Composition: Typography as hero element with strategic placement, generous negative space, and visual balance creating readability and impact
Quote Treatment: Professional typographic hierarchy emphasizing key words or phrases, excellent readability at all sizes

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Straight-on, frontal view optimized for graphic design clarity
Lens: Standard perspective maintaining design proportions
Lighting: Appropriate lighting creating depth and visual interest while ensuring text legibility. Lighting supports ${visualStyle} aesthetic
Depth of Field: Graphic design context with appropriate visual depth supporting typography without distraction

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Professional, high-quality aesthetic'}

**TEXT OVERLAY REQUIREMENTS:**
Quote Text: "${userInput.quote || 'Your inspiring quote here'}"
Typography: Professional, readable typeface matching ${visualStyle} aesthetic
Text Placement: Strategically positioned for maximum impact and readability
Text Color: High contrast with background ensuring perfect legibility
Text Size: Large enough to be easily read on mobile devices
Text Rendering: Crystal clear, sharp text with professional quality
Emphasis: Key words or phrases visually emphasized through size, weight, or color

**VISUAL EXECUTION:**
Color Palette: Brand-aligned colors supporting ${visualStyle} aesthetic and ensuring excellent text contrast
Typography: Professional, readable typefaces with clear hierarchy and appropriate scale for social media
Visual Elements: Subtle supporting graphics, patterns, or textures enhancing design without competing with text
Background: ${visualStyle} background treatment providing excellent contrast for readability
Design Quality: Professional graphic design standards, social media optimized, shareable quality
Text Integration: Quote text is the hero element, perfectly integrated into overall design

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Square (1:1), social media optimized for maximum engagement
Typography: Bold, readable, professionally designed with excellent legibility
Hierarchy: Visual emphasis on key quote words or phrases
Balance: Harmonious composition with text and visual elements working together

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional graphic design-grade, social media ready
Readability: Text clearly legible at all sizes, high contrast with background
Style: ${visualStyle} aesthetic throughout design
Cultural Sensitivity: Inclusive, appropriate, and universally accessible design

**OUTPUT REQUIREMENTS:**
The final image must present the quote "${userInput.quote || 'Your inspiring quote here'}" with professional graphic design quality and ${visualStyle} aesthetic. Text must be perfectly readable, visually engaging, and aligned with brand identity. Design should be scroll-stopping, shareable, and maintain professional standards while creating emotional connection through the quote.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'illegible text, cluttered, amateur design, poor typography, low contrast, unreadable, messy, competing elements, poor hierarchy'
        }
      };

    case 'behind_scenes':
      customStyleNotes = `Behind-the-scenes authentic moment, relatable, engaging`;

      return {
        finalPrompt: `
A photorealistic behind-the-scenes photograph capturing: ${userInput.sceneDescription || 'authentic behind-the-scenes moment'}

**SCENE DESCRIPTION:**
Subject: ${userInput.sceneDescription || 'authentic behind-the-scenes moment'} showing the human side and real process
Setting: Real working environment in vertical format (4:5) creating intimate, story-driven composition
Composition: Candid moment with natural, unforced positioning. Capture authentic action and genuine expressions showing real work in progress
Authenticity: Real, relatable moment that builds connection and shows the effort, care, and humanity behind the brand

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Documentary-style perspective capturing natural moments as they unfold, slightly elevated or eye-level for authenticity
Lens: Standard to short telephoto (50-85mm equivalent) creating natural perspective and comfortable viewing distance
Lighting: Natural ambient lighting with minimal intervention, preserving authentic atmosphere. Soft window light or existing workspace lighting creating genuine, unforced illumination
Depth of Field: Moderate depth (f/4-f/5.6 equivalent) with gentle background softening while keeping main action sharp and clear

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Authentic, professional aesthetic'}

**VISUAL EXECUTION:**
Color Palette: Natural, true-to-life colors maintaining authenticity while aligned with brand aesthetic
Textures: Visible detail showing real materials, workspace elements, and genuine process
Atmosphere: Authentic, approachable, and professional - real work captured with respect and quality
Storytelling: Image conveys effort, care, process, and the human element behind the brand
Engagement: Relatable moment that makes audience feel connected to the brand's real story

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Vertical (4:5), mobile-optimized for social media stories and posts
Framing: Natural, documentary-style framing capturing authentic moments
Action: Real activity in progress, hands working, genuine expressions

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional documentary-grade photography with authentic feel
Style: Candid yet composed, real yet polished
Mood: Approachable, genuine, human, trustworthy
Cultural Sensitivity: Inclusive and respectful representation of people and work

**OUTPUT REQUIREMENTS:**
The final image must capture the authentic moment of "${userInput.sceneDescription || 'behind-the-scenes work'}" with documentary-quality photography that feels real and relatable while maintaining professional standards. Balance authenticity with visual appeal - genuine moments captured beautifully.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'staged, fake, overly polished, disconnected, artificial poses, studio setup, forced smiles, stiff postures, unrealistic perfection, sterile environment'
        }
      };

    case 'flat_lay':
      customStyleNotes = `Flat lay composition, overhead view, organized aesthetic`;

      return {
        finalPrompt: `
A photorealistic flat lay composition featuring: ${userInput.items || 'brand-related items'}

**SCENE DESCRIPTION:**
Subject: ${userInput.items || 'brand-related items'} arranged in thoughtfully curated overhead composition
Setting: Square format (1:1) flat lay in directly overhead perspective, items artfully styled on complementary surface
Composition: Organized yet organic arrangement with balanced visual weight. Items positioned with intentional spacing creating pleasing geometry and visual flow
Styling: Editorial-quality flat lay with professional prop styling, color coordination, and aesthetic curation

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Directly overhead (bird's eye view) at perfect 90-degree angle creating classic flat lay perspective
Lens: Standard to slight wide-angle (35-50mm equivalent) capturing full scene without distortion
Lighting: Soft, even overhead lighting creating minimal shadows. Bright, clean illumination showcasing all items clearly with consistent exposure across frame
Depth of Field: Deep focus (f/8-f/11 equivalent) keeping all items sharply focused from edge to edge

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Professional aesthetic'}

**VISUAL EXECUTION:**
Color Palette: Cohesive color story aligned with brand aesthetic, harmonious color relationships between items and background
Textures: Visible material details showing quality - fabrics, surfaces, finishes clearly rendered
Arrangement: Balanced composition with intentional negative space, items neither too crowded nor too sparse
Atmosphere: Clean, organized, Instagram-worthy aesthetic that feels curated yet approachable
Visual Interest: Varied item sizes, complementary shapes, thoughtful prop selection creating engaging composition

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Square (1:1), social media optimized
View: Perfect overhead perspective
Background: Clean surface (wood, marble, fabric, or solid color) complementing items
Balance: Asymmetrical yet balanced arrangement with visual weight distributed evenly

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Editorial flat lay photography-grade, social media ready
Style: Organized, aesthetic, professional curation
Surface: Clean background that enhances without competing
Cultural Sensitivity: Inclusive and appropriate item selection

**OUTPUT REQUIREMENTS:**
The final image must showcase "${userInput.items || 'brand-related items'}" in a beautifully styled flat lay composition with editorial quality. Items should be thoughtfully arranged with intentional spacing, cohesive color story, and professional aesthetic that maintains brand visual identity while being Instagram-worthy.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, messy, poor lighting, amateur, crooked angle, shadows, uneven lighting, chaotic arrangement, competing colors, poor composition'
        }
      };

    case 'process_shot':
      customStyleNotes = `Process/how-to visual, educational, step-by-step`;

      return {
        finalPrompt: `
A photorealistic process demonstration photograph showing: ${userInput.processDescription || 'the process or technique'}

**SCENE DESCRIPTION:**
Subject: ${userInput.processDescription || 'the process or technique'} captured mid-action with clear demonstration of technique
Setting: Vertical format (4:5) educational composition showing work in progress with hands, tools, and materials visible
Composition: Close-up perspective showing process details clearly. Hands actively working, demonstrating technique or step-by-step action
Educational Focus: Key process elements prominently visible, important steps or techniques clearly demonstrated

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Slightly elevated overhead or side angle providing clear view of process and technique being demonstrated
Lens: Macro or short telephoto (60-100mm equivalent) capturing detailed close-up of hands, tools, and work
Lighting: Bright, even lighting ensuring all process details are clearly visible. Soft directional light eliminating harsh shadows while maintaining dimensionality
Depth of Field: Moderate depth (f/5.6-f/8 equivalent) keeping active work area sharp while gently softening background elements

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Professional, educational aesthetic'}

**VISUAL EXECUTION:**
Color Palette: Clear, natural colors allowing accurate representation of materials and processes
Textures: Sharp detail showing material qualities, tool surfaces, and work in progress
Atmosphere: Professional expertise demonstrated with approachable, teachable presentation
Expert Demonstration: Confident hand positioning, proper technique, professional execution showing mastery
Educational Clarity: Process steps clearly visible and understandable, making technique accessible to viewers

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Vertical (4:5), mobile-optimized for tutorials and how-to content
Framing: Close-up of active work area showing hands and process clearly
Action: Mid-process capture showing technique in action, not static posed setup
Detail Visibility: Important elements large enough in frame to see clearly

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional instructional photography-grade with educational clarity
Style: Expert demonstration made accessible and engaging
Detail: Sharp focus on process showing technique clearly
Cultural Sensitivity: Inclusive representation of hands, tools, and techniques

**OUTPUT REQUIREMENTS:**
The final image must clearly demonstrate "${userInput.processDescription || 'the process or technique'}" with professional instructional photography quality. Process must be visible, understandable, and presented by expert hands in a way that builds trust, demonstrates expertise, and makes the technique accessible to viewers.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'unclear, confusing, unprofessional, poor detail, blurry hands, obscured process, static pose, no action, messy workspace, poor lighting'
        }
      };

    case 'social_story':
      customStyleNotes = `Instagram/Facebook Story format, vertical, engaging`;

      return {
        finalPrompt: `
A photorealistic vertical social media story image for: ${userInput.storyContent || 'engaging story content'}

**SCENE DESCRIPTION:**
Subject: ${userInput.storyContent || 'engaging story content'} presented as scroll-stopping mobile story
Setting: Vertical format (9:16) optimized for Instagram/Facebook Stories and Reels viewing
Composition: Mobile-first vertical composition with key content positioned in story-safe zones (avoiding top 15% and bottom 20% where UI elements appear)
Visual Impact: Immediate attention-grabbing design that stops scrolling, encourages viewing and engagement

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Vertical framing optimized for mobile phone viewing, perspective suited to content type
Lens: Focal length appropriate to subject creating natural mobile viewing experience
Lighting: Bright, vibrant lighting creating energy and visual appeal on mobile screens. High contrast and clarity for small screen visibility
Depth of Field: Selective focus appropriate to content, creating visual interest and directing viewer attention

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Engaging, professional aesthetic'}

**VISUAL EXECUTION:**
Color Palette: Vibrant, attention-grabbing colors aligned with brand aesthetic and optimized for mobile screens
Visual Energy: Dynamic, engaging composition creating immediacy and stopping scrolling behavior
Mobile Optimization: High contrast, clear focal points, excellent visibility on phone screens
Safe Zones: Critical content positioned between 15% from top and 20% from bottom, avoiding UI overlap
Vertical Flow: Natural top-to-bottom visual flow guiding viewer through story content

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Vertical (9:16), Instagram/Facebook Stories optimized
Layout: Mobile-first vertical composition with story-safe content placement
Engagement: Scroll-stopping visual impact with immediate viewer connection
Readability: Clear, visible elements optimized for mobile viewing

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Social media story-grade, mobile-optimized visual quality
Format: Vertical orientation, 9:16 aspect ratio mandatory
Mobile Optimization: Excellent visibility and impact on phone screens
Cultural Sensitivity: Inclusive and appropriate for diverse mobile audiences

**OUTPUT REQUIREMENTS:**
The final image must present "${userInput.storyContent || 'engaging story content'}" in vertical 9:16 format optimized for mobile Stories viewing. Content must be positioned in safe zones, create scroll-stopping impact, and maintain excellent visibility on mobile screens while preserving brand visual identity. Vertical format is mandatory - no horizontal or square compositions.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: '9:16',
          customStyleNotes,
          negativePrompt: 'horizontal format, poor mobile optimization, boring, square format, landscape orientation, content in unsafe zones, low contrast, poor mobile visibility'
        }
      };

    case 'lifestyle_scene':
      customStyleNotes = `Lifestyle photography, authentic context, relatable`;

      return {
        finalPrompt: `
A photorealistic lifestyle photograph showing: ${userInput.contextDescription || 'product or service in authentic use context'}

**SCENE DESCRIPTION:**
Subject: ${userInput.contextDescription || 'product or service in authentic real-life context'} captured in genuine use moment
Setting: Real-life environment in vertical format (4:5) creating intimate, relatable composition. Authentic living space, workspace, or lifestyle setting where product naturally belongs
Composition: Natural scene with product integrated organically into everyday life. Subject using or interacting with product in genuine way, creating aspirational yet achievable lifestyle moment
Context: Real environment with authentic props, furnishings, and details that tell a story and create emotional connection

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Slightly elevated or eye-level perspective creating natural, first-person viewpoint that invites audience into the scene
Lens: Standard focal length (50mm equivalent) capturing scene as human eye sees it, creating intimate connection
Lighting: Soft, natural window light creating warm, inviting atmosphere. Gentle directional light with soft shadows maintaining authenticity while showcasing subject beautifully
Depth of Field: Selective focus (f/2.8-f/4 equivalent) with product and user in sharp focus, background softly blurred creating depth and intimacy

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Authentic, relatable aesthetic'}

**VISUAL EXECUTION:**
Color Palette: Natural, warm tones creating inviting atmosphere while aligned with brand aesthetic
Textures: Visible environmental detail showing real materials, comfortable spaces, lived-in authenticity
Atmosphere: Aspirational yet achievable, relatable yet beautiful, authentic yet polished
Lifestyle Narrative: Scene tells story of how product fits naturally into desirable daily life
Emotional Connection: Image makes audience see themselves in this moment, desire this experience

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Vertical (4:5), mobile-optimized for social media and lifestyle content
Framing: Natural, editorial-style composition with product integrated into scene
Human Element: Hands, partial figure, or person naturally interacting with product
Environmental Context: Surrounding elements that enhance story and create lifestyle appeal

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Editorial lifestyle photography-grade, suitable for marketing and social media
Style: Authentic yet aspirational, real yet beautiful
Mood: Warm, inviting, relatable, desirable
Cultural Sensitivity: Inclusive, diverse, and respectful lifestyle representation

**OUTPUT REQUIREMENTS:**
The final image must showcase "${userInput.contextDescription || 'product in authentic use'}" within a genuine lifestyle context that is both relatable and aspirational. Balance authenticity with beauty - real life captured at its best moment, making audience desire to experience this themselves.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'staged, fake, disconnected, unrealistic, overly perfect, sterile, cold, impersonal, stock photo feel, artificial setup'
        }
      };

    case 'team_introduction':
      // Determine mood-specific atmosphere and lighting
      let teamAtmosphere = '';
      let teamLighting = '';
      const teamMood = userInput.mood || 'Professional';

      if (teamMood === 'Friendly & Approachable') {
        teamAtmosphere = 'warm, welcoming office environment with casual professionalism. Relaxed yet polished setting showing approachable team culture';
        teamLighting = 'Soft, warm natural lighting creating friendly, inviting atmosphere. Gentle window light with warm color temperature promoting approachability and connection';
      } else if (teamMood === 'Creative & Dynamic') {
        teamAtmosphere = 'creative workspace with modern design elements and energetic vibe. Contemporary setting reflecting innovation and dynamic team spirit';
        teamLighting = 'Bright, clean lighting with good contrast creating energetic, vibrant atmosphere. Modern lighting setup showcasing creative energy and forward-thinking culture';
      } else if (teamMood === 'Warm & Inviting') {
        teamAtmosphere = 'comfortable, welcoming environment with warm tones and inviting details. Cozy professional setting emphasizing human connection';
        teamLighting = 'Golden, warm lighting creating comforting, inviting atmosphere. Soft directional light with warm tones fostering emotional connection and trust';
      } else {
        teamAtmosphere = 'professional office or branded environment with clean, organized aesthetic. Polished setting reflecting competence and expertise';
        teamLighting = 'Professional portrait lighting with balanced highlights and shadows creating polished, trustworthy atmosphere. Clean, flattering illumination showcasing professionalism';
      }

      customStyleNotes = `Professional team photography, ${teamMood} atmosphere, authentic and approachable`;

      return {
        finalPrompt: `
A photorealistic professional portrait photograph of: ${userInput.teamContext || 'team members'}

**SCENE DESCRIPTION:**
Subject: ${userInput.teamContext || 'team members'} in professional portrait capturing authentic personality and professional presence
Setting: Vertical format (4:5) in ${teamAtmosphere}
Composition: Portrait composition with team members positioned naturally, making eye contact with camera creating personal connection with viewer
People: Genuine expressions showing confidence and approachability, natural relaxed posture, authentic smiles or professional demeanor appropriate to brand

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Eye-level perspective creating equal, respectful connection between subject and viewer
Lens: Portrait lens (85mm equivalent) creating flattering perspective and natural facial proportions
Lighting: ${teamLighting}
Depth of Field: Selective focus (f/2.8-f/4 equivalent) with people sharply focused, background gently softened providing context without distraction

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Professional, authentic aesthetic'}

**VISUAL EXECUTION:**
Color Palette: ${teamMood} tones aligned with brand aesthetic, creating appropriate atmosphere
Textures: Visible environmental details showing real workspace, quality furnishings, professional setting
Atmosphere: ${teamMood}, trustworthy, authentic, creating human connection and relatability
Body Language: Confident yet approachable posture, natural positioning, genuine expressions
Professionalism: Polished appearance maintaining professional standards while showing authentic personality

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Vertical (4:5), mobile-optimized for social media and team pages
Framing: Portrait composition with appropriate headroom and breathing space
Expression: Genuine, natural expressions - authentic smiles or professional demeanor
Environment: Branded or professional background providing context without competing

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional portrait photography-grade suitable for team pages, about us sections, and marketing
Style: Polished yet authentic, professional yet approachable
Mood: ${teamMood}, building trust and human connection
Cultural Sensitivity: Diverse, inclusive, and respectful representation

**OUTPUT REQUIREMENTS:**
The final image must showcase "${userInput.teamContext || 'team members'}" with professional portrait quality that humanizes the brand. Capture authentic personality and professionalism with ${teamMood} atmosphere, creating trust and personal connection while maintaining brand visual identity.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'stiff, awkward, unprofessional, poor lighting, artificial, forced smiles, uncomfortable poses, harsh lighting, sterile environment, corporate stiffness'
        }
      };

    case 'announcement_card':
      // Determine urgency-specific visual approach
      let urgencyVisuals = '';
      const urgency = userInput.urgency || 'Exciting News';

      if (urgency === 'Important Update') {
        urgencyVisuals = 'professional, clear visual design with strong but measured contrast. Organized layout emphasizing importance through clean hierarchy and structured composition';
      } else if (urgency === 'Urgent Alert') {
        urgencyVisuals = 'bold, high-impact visual design with dramatic contrast and eye-catching elements. Strong visual urgency through dynamic composition and commanding presence';
      } else if (urgency === 'Coming Soon') {
        urgencyVisuals = 'anticipatory, intriguing visual design building excitement and curiosity. Modern, forward-looking aesthetic creating sense of anticipation';
      } else {
        urgencyVisuals = 'vibrant, energetic visual design with positive, celebratory aesthetic. Upbeat, engaging composition creating excitement and shareability';
      }

      customStyleNotes = `Announcement graphic, ${urgency} visual style, bold and attention-grabbing`;

      return {
        finalPrompt: `
A photorealistic announcement card design with text for: ${userInput.announcementType || 'important update'}

**SCENE DESCRIPTION:**
Subject: ${userInput.announcementType || 'important update'} presented as compelling visual announcement with professional text overlay
Setting: Square format (1:1) graphic design optimized for social media sharing and maximum visibility
Composition: ${urgencyVisuals}
Visual Focus: Strong focal point with announcement text "${userInput.announcementType || 'important update'}" as the primary element, integrated into compelling background design
Text Integration: Bold, attention-grabbing text rendering communicating the announcement clearly and professionally

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Straight-on, frontal composition for graphic clarity and optimal text visibility
Lens: Standard perspective maintaining natural proportions and graphic clarity
Lighting: Bright, even lighting with appropriate contrast level for ${urgency} mood. Clean illumination supporting text readability and visual impact
Depth of Field: Context-appropriate depth creating visual interest while maintaining text clarity

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Professional, engaging aesthetic'}

**TEXT OVERLAY REQUIREMENTS:**
Announcement Text: "${userInput.announcementType || 'important update'}"
Urgency Label: "${urgency}" (displayed as secondary text element)
Typography: Bold, modern sans-serif font appropriate for ${urgency} level
Text Placement: Centrally positioned or strategically placed for maximum impact
Text Color: High contrast ensuring excellent readability (typically white on dark, dark on light)
Text Hierarchy: Main announcement as primary text, urgency level as supporting text
Legibility: Crystal clear text rendering at all sizes

**VISUAL EXECUTION:**
Color Palette: High contrast, attention-grabbing colors aligned with brand aesthetic and ${urgency} tone
Visual Impact: Scroll-stopping graphic with bold text commanding immediate attention
Hierarchy: Text as primary element, supported by compelling background design and brand presence
Shareability: Engaging, shareable design that looks professional across social platforms
Text Integration: Text and background work together harmoniously as complete announcement card

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Square (1:1), social media optimized
Layout: Bold, clear visual hierarchy with text as focal point
Design Style: Professional yet engaging, attention-grabbing yet refined
Balance: Asymmetrical dynamic composition or centered power composition based on urgency level

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional graphic design-grade, social media ready
Contrast: High readability with clear visual separation
Text Quality: Sharp, crisp, perfectly legible text rendering
Mood: ${urgency} tone throughout design
Cultural Sensitivity: Appropriate, inclusive visual communication

**OUTPUT REQUIREMENTS:**
The final image must be a complete announcement card with "${userInput.announcementType || 'important update'}" rendered as professional text with ${urgency} urgency level. Text must be bold, highly readable, and create scroll-stopping impact. The design should maintain brand visual identity while commanding attention with professional text-on-image rendering ready for social media sharing.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, illegible, dull, boring, unprofessional, messy, low contrast, poor hierarchy, competing elements, text-unfriendly background'
        }
      };

    case 'testimonial_card':
      // Testimonial card with quote and attribution
      customStyleNotes = `Testimonial card design, social proof presentation, clean and trustworthy`;

      return {
        finalPrompt: `
A photorealistic testimonial card design featuring: ${userInput.testimonialText || 'customer testimonial'}

**SCENE DESCRIPTION:**
Subject: ${userInput.testimonialText || 'customer testimonial'} presented as professional testimonial card with quote and attribution
Setting: Square format (1:1) minimalist graphic design optimized for trust and credibility
Composition: Clean, uncluttered layout with testimonial quote as primary element
Visual Focus: Testimonial text as hero element with subtle trust indicators (quote marks, attribution, optional rating)
Text Integration: Professional typography rendering the quote clearly and authentically

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Straight-on, frontal composition for graphic clarity and optimal text readability
Lens: Standard perspective maintaining natural proportions and clean presentation
Lighting: Soft, even lighting creating trustworthy, approachable atmosphere. Professional illumination supporting text readability without harsh shadows
Depth of Field: Minimal depth complexity keeping focus on text content and credibility elements

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Clean, trustworthy, minimalist aesthetic'}

**TEXT OVERLAY REQUIREMENTS:**
Testimonial Quote: "${userInput.testimonialText || 'customer testimonial'}"
Attribution: ${userInput.clientName ? `"${userInput.clientName}" (displayed as secondary attribution element)` : 'Anonymous testimonial (no attribution displayed)'}
Typography: Professional, readable font conveying trust and authenticity
Text Placement: Centrally positioned or strategically placed for maximum readability
Text Color: High contrast ensuring excellent legibility (clean, professional color scheme)
Text Hierarchy: Testimonial quote as primary text, client name as supporting attribution
Legibility: Crystal clear text rendering at all sizes
Quote Marks: Subtle visual quote marks or formatting indicating testimonial nature

**VISUAL EXECUTION:**
Color Palette: Clean, minimal colors aligned with brand aesthetic conveying trust and professionalism
Trust Indicators: Subtle elements like star ratings, quote marks, or credibility badges as appropriate
Social Proof Design: Professional testimonial presentation that feels authentic and genuine
Hierarchy: Quote text as primary element, attribution secondary, brand presence subtle
Shareability: Clean, shareable design that maintains credibility across social platforms
Authenticity: Design feels genuine and unforced, not overly sales-y or artificial

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Square (1:1), social media optimized
Layout: Minimalist, clean visual hierarchy with quote as focal point
Design Style: Professional, trustworthy, authentic presentation
Balance: Centered or asymmetrical composition supporting text readability and visual flow

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional graphic design-grade, social media ready
Contrast: High readability with clear visual separation between text and background
Text Quality: Sharp, crisp, perfectly legible text rendering
Mood: Trustworthy, authentic, professional tone throughout
Cultural Sensitivity: Appropriate, inclusive visual communication

**OUTPUT REQUIREMENTS:**
The final image must be a complete testimonial card with "${userInput.testimonialText || 'customer testimonial'}" rendered as professional text${userInput.clientName ? ` attributed to ${userInput.clientName}` : ''}. The design must convey trust, authenticity, and social proof while maintaining brand visual identity. Text must be highly readable and create credible impact ready for social media sharing.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, busy, unreadable text, low contrast, unprofessional typography, fake, staged, overly promotional, sales-y, hard to read, poor hierarchy'
        }
      };

    case 'promotional_badge':
      // Determine urgency/promotion-specific visual approach based on offer details
      let promotionalVisuals = '';
      const offerDetails = userInput.offerDetails?.toLowerCase() || '';

      if (offerDetails.includes('limited') || offerDetails.includes('ends')) {
        promotionalVisuals = 'High urgency design with time-sensitive visual cues, bold colors, and dynamic composition creating immediate FOMO (fear of missing out). Energetic, action-driving aesthetic';
      } else if (offerDetails.includes('exclusive') || offerDetails.includes('vip')) {
        promotionalVisuals = 'Premium, exclusive aesthetic with sophisticated design elements. Upscale promotional presentation conveying special access and value';
      } else if (offerDetails.includes('flash') || offerDetails.includes('today')) {
        promotionalVisuals = 'Flash sale urgency with explosive, attention-grabbing design. Maximum energy and immediate action focus';
      } else {
        promotionalVisuals = 'Bold, value-focused promotional design with strong visual impact. Eye-catching, conversion-optimized aesthetic creating excitement and interest';
      }

      customStyleNotes = `Promotional badge design, sale announcement, ${userInput.offer || 'special offer'}, bold and conversion-focused`;

      return {
        finalPrompt: `
A vibrant promotional badge design featuring: ${userInput.offer || 'Special Offer'}

**SCENE DESCRIPTION:**
Subject: ${userInput.offer || 'Special Offer'} presented as bold promotional badge with high-impact text overlay
Setting: Square format (1:1) promotional graphic design optimized for social media and maximum conversion
Composition: ${promotionalVisuals}
Visual Focus: Offer text "${userInput.offer || 'Special Offer'}" as dominant hero element commanding immediate attention
Text Integration: Large, bold typography rendering the offer prominently and irresistibly
${userInput.offerDetails ? `Promotional Details: ${userInput.offerDetails} (displayed as secondary supporting text)` : ''}

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Straight-on, frontal composition for maximum promotional impact and text visibility
Lens: Standard perspective maintaining graphic clarity and promotional effectiveness
Lighting: Bright, high-energy lighting with strong contrast creating urgency and excitement. Dynamic illumination supporting conversion psychology
Depth of Field: Graphic focus maintaining clarity while creating visual interest and promotional energy

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Retail'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Vibrant, energetic, conversion-focused aesthetic'}

**TEXT OVERLAY REQUIREMENTS:**
Main Offer Text: "${userInput.offer || 'Special Offer'}" (displayed as large, dominant text element)
${userInput.offerDetails ? `Offer Details: "${userInput.offerDetails}" (displayed as secondary text providing context and urgency)` : 'Offer Details: No additional details (focus entirely on main offer)'}
Typography: Extra bold, attention-grabbing font that screams value and urgency
Text Placement: Centrally positioned or strategically placed as focal point for scroll-stopping impact
Text Color: Maximum contrast ensuring instant readability (often white on bold colors, or bold text on vibrant backgrounds)
Text Hierarchy: Offer as primary hero text (largest), details as supporting secondary text
Legibility: Ultra-clear text rendering visible at thumbnail sizes
Sale Indicators: Badge, label, or starburst elements emphasizing promotional nature

**VISUAL EXECUTION:**
Color Palette: High-energy, attention-grabbing colors creating urgency (reds, oranges, yellows, or brand colors amplified). High saturation and contrast
Urgency Psychology: Visual elements triggering FOMO and immediate action desire
Call-to-Action Focus: Design elements directing attention to offer and encouraging conversion
Hierarchy: Offer text as dominant element, supported by promotional design elements and brand presence
Shareability: Scroll-stopping graphic that compels sharing and drives traffic
Promotional Energy: ${promotionalVisuals}

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Square (1:1), social media and advertising optimized
Layout: Bold, dynamic visual hierarchy with offer as unmissable focal point
Design Style: Promotional badge/label aesthetic with energetic, conversion-optimized design
Balance: Asymmetrical dynamic composition or centered power composition maximizing offer visibility

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional promotional graphic-grade, social media and advertising ready
Contrast: Maximum readability with bold visual separation creating immediate impact
Text Quality: Sharp, crisp, perfectly legible text rendering at all sizes
Mood: Exciting, urgent, value-driven promotional tone throughout
Cultural Sensitivity: Appropriate, inclusive promotional communication
Conversion Focus: Every design element supports the goal of driving action

**OUTPUT REQUIREMENTS:**
The final image must be a scroll-stopping promotional badge featuring "${userInput.offer || 'Special Offer'}" as the dominant text element${userInput.offerDetails ? ` with supporting details "${userInput.offerDetails}"` : ''}. The design must create immediate visual impact, trigger urgency and excitement, and drive conversion. Text must be ultra-readable, bold, and create irresistible promotional appeal ready for social media, ads, and marketing campaigns.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, confusing, hard to read, dull colors, low contrast, unprofessional, amateur design, weak call to action, boring, passive, unclear offer, small text, poor hierarchy'
        }
      };

    case 'event_announcement':
      // Determine event-specific atmosphere based on event name/type
      let eventAtmosphere = '';
      const eventName = userInput.eventName?.toLowerCase() || '';

      if (eventName.includes('launch') || eventName.includes('unveil') || eventName.includes('reveal')) {
        eventAtmosphere = 'Anticipatory, exciting atmosphere building product/service launch hype with forward-looking energy. Dynamic, modern aesthetic creating buzz and excitement';
      } else if (eventName.includes('webinar') || eventName.includes('workshop') || eventName.includes('training') || eventName.includes('seminar')) {
        eventAtmosphere = 'Educational, professional atmosphere emphasizing value and learning opportunities. Trustworthy, informative design encouraging registration';
      } else if (eventName.includes('sale') || eventName.includes('flash') || eventName.includes('deals')) {
        eventAtmosphere = 'Energetic, time-sensitive atmosphere creating urgency and shopping excitement. Bold, promotional energy driving immediate action';
      } else if (eventName.includes('grand opening') || eventName.includes('celebration') || eventName.includes('party')) {
        eventAtmosphere = 'Celebratory, festive atmosphere with joyful, inviting energy. Exciting, welcoming design encouraging attendance';
      } else {
        eventAtmosphere = 'Engaging, inviting atmosphere generating interest and attendance desire. Professional yet exciting design creating anticipation';
      }

      customStyleNotes = `Event announcement design, ${userInput.eventName || 'upcoming event'}, engaging and informative`;

      return {
        finalPrompt: `
A vibrant event announcement graphic featuring: ${userInput.eventName || 'Upcoming Event'}

**SCENE DESCRIPTION:**
Subject: ${userInput.eventName || 'Upcoming Event'} presented as compelling event announcement with clear information hierarchy
Setting: Square format (1:1) event graphic design optimized for social media sharing and maximum visibility
Composition: ${eventAtmosphere}
Visual Focus: Event name "${userInput.eventName || 'Upcoming Event'}" as primary element with event details as supporting information
Text Integration: Bold, clear typography rendering event information prominently and invitingly
${userInput.eventDetails ? `Event Details: ${userInput.eventDetails} (displayed as important secondary information)` : ''}

**PHOTOGRAPHY SPECIFICATIONS:**
Camera Angle: Straight-on, frontal composition for maximum informational clarity and visual impact
Lens: Standard perspective maintaining graphic clarity and professional presentation
Lighting: Bright, inviting lighting aligned with event atmosphere. ${eventAtmosphere.includes('professional') ? 'Clean, professional illumination' : 'Dynamic, energetic lighting'} supporting readability and engagement
Depth of Field: Graphic clarity maintaining focus on event information while creating visual interest

**BRAND AUTHENTICITY (CRITICAL):**
Brand: ${userBrandData.brandName || 'Your brand'}
Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
Industry Context: ${userBrandData.industry || 'Professional services'}
Visual Identity: ${userBrandData.imageStyleNotes || 'Vibrant, engaging, professional aesthetic'}

**TEXT OVERLAY REQUIREMENTS:**
Event Name: "${userInput.eventName || 'Upcoming Event'}" (displayed as large, primary text element)
${userInput.eventDetails ? `Event Details: "${userInput.eventDetails}" (displayed as secondary text with date/time/location information)` : 'Event Details: No additional details provided (focus on event name and atmosphere)'}
Typography: Bold, modern font creating excitement and readability
Text Placement: Strategic positioning creating clear information hierarchy (event name → details → brand)
Text Color: High contrast ensuring excellent readability across platforms
Text Hierarchy: Event name as primary hero text, details as supporting secondary information
Legibility: Crystal clear text rendering ensuring all event information is instantly readable
Calendar Appeal: Design elements making viewers want to save the date

**VISUAL EXECUTION:**
Color Palette: Vibrant, attention-grabbing colors aligned with brand and event type creating appropriate mood
Event Atmosphere: ${eventAtmosphere}
Information Hierarchy: Event name dominant, details secondary, brand presence subtle but present
Shareability: Engaging, shareable design that spreads organically across social platforms
Anticipation Building: Visual elements creating excitement and desire to attend
Save-Worthy Design: Calendar-ready graphic viewers want to save and share

**COMPOSITION GUIDELINES:**
${compositionGuide}
Format: Square (1:1), social media optimized for maximum reach
Layout: Clear visual hierarchy prioritizing event information over decorative elements
Design Style: Event announcement aesthetic balancing professional credibility with excitement
Balance: Asymmetrical dynamic composition or centered power composition based on event type

**TECHNICAL REQUIREMENTS:**
${technicalNotes}
Quality: Professional event marketing-grade, social media and email ready
Contrast: High readability with clear visual separation ensuring information accessibility
Text Quality: Sharp, crisp, perfectly legible text rendering at all sizes
Mood: ${eventAtmosphere.split('.')[0]} throughout design
Cultural Sensitivity: Appropriate, inclusive event communication welcoming all potential attendees
Shareability: Optimized for forwarding, sharing, and viral spread

**OUTPUT REQUIREMENTS:**
The final image must be a compelling event announcement featuring "${userInput.eventName || 'Upcoming Event'}" as the dominant text element${userInput.eventDetails ? ` with clear event details "${userInput.eventDetails}"` : ''}. The design must create interest, build anticipation, and drive event registration/attendance. Information hierarchy must be crystal clear with event name, details, and brand presence balanced effectively. Ready for social media sharing, email marketing, and event promotion campaigns.
        `.trim(),
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes,
          negativePrompt: 'cluttered, confusing, hard to read, dull, boring, unprofessional, unclear information, poor hierarchy, messy layout, competing elements, missing information'
        }
      };

    default:
      // Fallback for image templates without specific case handlers
      // Use template presets directly to ensure aspectRatio and other fields are always defined
      console.warn(`Template ID "${template.id}" does not have a specific case handler. Using generic template presets.`);
      return {
        finalPrompt: `Generate a professional, high-quality image for: ${userBrandData.brandName || 'brand marketing'}.\n\nBrand: ${userBrandData.brandDescription || 'Professional brand'}\nIndustry: ${userBrandData.industry || 'General'}\nStyle: ${template.presets.imageStyle || 'professional'}`,
        autoFilledFields: {
          imageStyle: template.presets.imageStyle,
          aspectRatio: template.presets.aspectRatio,
          customStyleNotes: '',
          negativePrompt: 'low quality, blurry, amateur, unprofessional'
        }
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
      const finalPromptProductLaunch = `
**PRODUCT LAUNCH ANNOUNCEMENT FRAMEWORK**

You are crafting a compelling product launch post for: ${userInput.productName || 'new product'}

**Launch Details:**
- Product: ${userInput.productName || 'new product'}
- Target Audience: ${userInput.targetAudience || 'potential customers'}
- Call-to-Action: ${userInput.callToAction || 'Check it out!'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Brand Story: ${userBrandData.brandDescription || 'Professional brand presence'}
- Industry: ${userBrandData.industry || 'Professional services'}

**Strategic Structure - Follow This Framework:**

1. **HOOK (Opening Line)** - Create immediate curiosity
   - Use pattern interruption or bold statement
   - Make it scroll-stopping and attention-grabbing
   - Examples: Intriguing question, surprising fact, bold declaration
   - Connect to audience pain point or desire

2. **PROBLEM → SOLUTION** - Build emotional connection
   - Identify the specific challenge or need for ${userInput.targetAudience || 'your audience'}
   - Position ${userInput.productName || 'this product'} as the natural solution
   - Use "you" language to create personal relevance
   - Show understanding of their world

3. **UNIQUE VALUE PROPOSITION** - Differentiate clearly
   - Highlight 2-3 specific features or tangible benefits
   - Focus on OUTCOMES and transformations, not just features
   - Answer: "Why THIS product?" and "Why NOW?"
   - Make it memorable and specific

4. **SOCIAL PROOF / URGENCY** - Build credibility and FOMO
   - Reference: development journey, testing phase, early feedback, or anticipation
   - Create urgency without being pushy (limited availability, launch timing, exclusive access)
   - Build trust through authenticity
   - Spark genuine excitement

5. **CLEAR CALL-TO-ACTION** - Drive action
   - Primary action: ${userInput.callToAction || 'Check it out!'}
   - Make it frictionless and obvious
   - Create momentum toward conversion
   - Tell them exactly what to do next

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Reference it naturally in your caption (don't just describe it)
- Use the visual to amplify your hook or value proposition
- Create synergy: "As you can see...", "The image shows...", "Just like in the photo..."
- Let text and image work together, not repeat each other
{{else}}
**TEXT-ONLY POST:**
Since no image is provided, create vivid mental imagery with your words.
Paint a picture that helps the audience visualize the product and its benefits.
{{/if}}

**TONE REQUIREMENTS:**
- Professional confidence (NOT salesy hype or exaggeration)
- Authentic enthusiasm (NOT fake excitement or manufactured urgency)
- Customer-focused (NOT brand-centric or self-promotional)
- Tone balance: {{{tone}}}

**PLATFORM & CHARACTER OPTIMIZATION:**
{{#if isInstagram}}
- Optimal length: 150-300 characters for best engagement
- Maximum: 1000 characters if needed for storytelling
- Hashtags: 5-7 highly relevant hashtags (mix of reach and niche)
{{/if}}
{{#if isTwitter}}
- STRICT 280 character limit (including spaces)
- Hashtags: 1-2 hashtags maximum
- Every word must count
{{/if}}
{{#if isLinkedIn}}
- Professional tone mandatory, thought leadership angle
- Length: 300-500 characters ideal
- Hashtags: 3-5 professional, industry-focused hashtags
{{/if}}
{{#if isMultiPlatform}}
- Safe length: 250 characters (works across all platforms)
- Hashtags: 3-5 universal hashtags
{{/if}}

**OUTPUT:** Generate a scroll-stopping product launch post following this strategic framework. Make every word count.
      `.trim();

      return {
        finalPrompt: finalPromptProductLaunch,
        autoFilledFields: {
          postGoal: 'promotion',
          tone: 'professional',
          targetAudience: userInput.targetAudience || '',
          callToAction: userInput.callToAction || 'Check it out!',
          imageDescription: userInput.productName
            ? `Product launch announcement for ${userInput.productName}. Focus on what problem it solves, why it's unique, and why customers should be excited.`
            : ''
        }
      };

    case 'quick_tip':
      const finalPromptQuickTip = `
**VALUABLE TIP POST FRAMEWORK**

You are sharing actionable expertise on: ${userInput.tipTopic || 'valuable topic'}

**Tip Details:**
- Topic: ${userInput.tipTopic || 'valuable topic'}
- Target Audience: ${userInput.targetAudience || 'followers seeking valuable tips'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Expertise Area: ${userBrandData.industry || 'your industry'}
- Brand Voice: ${userBrandData.brandDescription || 'Professional presence'}

**Educational Content Structure - Follow This Framework:**

1. **ATTENTION-GRABBING INTRO** - Hook them instantly
   - Start with the problem or common mistake people make
   - Use powerful opening patterns:
     * "Did you know that most people get X wrong?"
     * "Here's the #1 mistake I see with [topic]..."
     * "Stop doing X. Here's what actually works..."
   - Make them realize they NEED this tip

2. **THE TIP (Core Value)** - Deliver the goods
   - ONE clear, actionable tip about ${userInput.tipTopic || 'the topic'}
   - Make it specific, NOT vague or generic
   - Use concrete language they can immediately understand
   - Frame it as: "Instead of X, do Y"

3. **WHY IT WORKS** - Build authority and trust
   - Brief explanation of the science, logic, or reasoning
   - Show you're not just guessing - you KNOW this
   - Use: "The reason this works is...", "This is effective because..."
   - Keep it accessible, not overly technical

4. **HOW TO APPLY IT** - Make it actionable
   - 2-3 concrete steps or real-world examples
   - Show them EXACTLY what to do
   - Remove all barriers to implementation
   - Example: "Here's how: 1) [step] 2) [step] 3) [step]"

5. **ENGAGEMENT HOOK** - Spark conversation
   - End with a question that invites comments
   - "Have you tried this?", "What's your experience with X?"
   - Create community dialogue, not just broadcast
   - Make followers want to share their story

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Use image to illustrate the tip in action
- Show before/after, step-by-step, or demonstration
- Reference it: "As you can see...", "The visual shows exactly..."
- Let image enhance understanding, not just decorate
{{else}}
**TEXT-ONLY TIP:**
Create crystal-clear explanations that don't need visuals.
Use analogies, metaphors, or step-by-step descriptions to ensure understanding.
{{/if}}

**TONE REQUIREMENTS:**
- Expert but approachable (NOT condescending or show-off)
- Teacher, not preacher (helpful, not preachy)
- Generous with knowledge (give real value, not teases)
- Tone: {{{tone}}}

**VALUE CHECKLIST:**
- ✓ Tip is immediately actionable
- ✓ Explanation builds credibility
- ✓ Application steps are clear
- ✓ Ends with engagement question

**OUTPUT:** Generate an educational tip post that provides genuine, actionable value and positions the brand as a helpful expert.
      `.trim();

      return {
        finalPrompt: finalPromptQuickTip,
        autoFilledFields: {
          postGoal: 'informational',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'followers seeking valuable tips',
          imageDescription: userInput.tipTopic
            ? `Visual demonstration or illustration of ${userInput.tipTopic}. Show the tip in action or a key step.`
            : ''
        }
      };

    case 'question_post':
      const finalPromptQuestion = `
**ENGAGEMENT QUESTION POST FRAMEWORK**

You are crafting an engaging question post about: ${userInput.questionTopic || 'relevant topic'}

**Question Context:**
- Topic: ${userInput.questionTopic || 'relevant topic'}
- Target Audience: ${userInput.targetAudience || 'engaged community members'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Community: ${userBrandData.brandDescription || 'your community'}

**Engagement-Focused Structure:**

1. **CONTEXT SETUP** - Frame the question
   - Briefly introduce WHY you're asking this question
   - Share a relevant observation or experience
   - Make it relatable: "We've been thinking about...", "Something interesting happened..."
   - Create curiosity before the question

2. **THE QUESTION** - Make it compelling
   - Ask ONE clear, specific question about ${userInput.questionTopic || 'the topic'}
   - Make it:
     * Easy to answer (lower the barrier)
     * Interesting to think about
     * Relevant to your audience's experience
   - Avoid yes/no questions unless strategic
   - Example structures: "What's your go-to...", "How do you handle...", "Which do you prefer..."

3. **ENGAGEMENT AMPLIFIERS** - Encourage participation
   - Give them permission to share: "No wrong answers!", "We want to hear from everyone!"
   - Add a mini-example if helpful: "For us, it's [example]"
   - Create safe space for diverse opinions
   - Show genuine curiosity

4. **CALL TO PARTICIPATION** - Direct invitation
   - Clear instruction: "Drop your answer in the comments!"
   - Bonus points: "Tag someone who needs to see this!"
   - Create momentum: "Let's see what the community thinks!"

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Use image to illustrate the question topic
- Visual should spark curiosity or provide context
- Reference it: "Look at this...", "This made us wonder..."
{{else}}
**TEXT-FOCUSED QUESTION:**
Let the question stand on its own merit.
Use clear, direct language that invites response.
{{/if}}

**TONE REQUIREMENTS:**
- Genuinely curious (NOT rhetorical or manipulative)
- Open and inclusive (welcoming all perspectives)
- Community-focused (building dialogue, not broadcasting)
- Tone: {{{tone}}}

**ENGAGEMENT OPTIMIZATION:**
- Question is specific enough to answer easily
- Context makes question interesting
- Invitation to participate is clear and welcoming

**OUTPUT:** Generate an engaging question post that sparks genuine conversation and community interaction.
      `.trim();

      return {
        finalPrompt: finalPromptQuestion,
        autoFilledFields: {
          postGoal: 'engagement',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'engaged community members',
          callToAction: 'Share your thoughts in the comments!'
        }
      };

    case 'milestone':
      const finalPromptMilestone = `
**MILESTONE CELEBRATION POST FRAMEWORK**

You are celebrating: ${userInput.milestoneDescription || 'significant achievement'}

**Milestone Details:**
- Achievement: ${userInput.milestoneDescription || 'significant achievement'}
- Community: ${userInput.targetAudience || 'our amazing community'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Journey: ${userBrandData.brandDescription || 'our story'}

**Celebration Structure - Follow This Framework:**

1. **THE ANNOUNCEMENT** - Share the exciting news
   - Lead with the milestone: "${userInput.milestoneDescription || 'We hit a major milestone'}!"
   - Make it celebratory and exciting
   - Use enthusiasm without being over-the-top
   - Create a moment of shared joy

2. **THE JOURNEY** - Reflect on the path
   - Briefly acknowledge the journey to get here
   - Show vulnerability: challenges faced, lessons learned
   - Make it relatable and authentic
   - Example: "Getting here wasn't easy...", "This journey taught us..."

3. **GRATITUDE FOCUS** - Thank the community
   - Shift focus from "we" to "you"
   - Be specific about how ${userInput.targetAudience || 'the community'} made this possible
   - Genuine appreciation, not generic thank-yous
   - Examples: "Because of you...", "Your support made this real..."
   - Name specific ways they contributed

4. **FORWARD MOMENTUM** - What's next
   - Don't just celebrate - create anticipation
   - Hint at what this milestone enables
   - Make them excited about the future together
   - Example: "This is just the beginning...", "Now we can..."

5. **COMMUNITY INVITATION** - Include them
   - Invite them to celebrate with you
   - Ask them to share their own journey/story
   - Create shared ownership of the achievement

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Use image to commemorate the milestone
- Could show: celebration, team, achievement visualization, before/after
- Reference it naturally: "Here's to...", "This moment..."
{{else}}
**TEXT CELEBRATION:**
Paint the milestone moment with words.
Create emotional resonance through storytelling.
{{/if}}

**TONE REQUIREMENTS:**
- Genuinely grateful (NOT entitled or self-congratulatory)
- Humble and community-focused (NOT brand-centric bragging)
- Inspirational and forward-looking (NOT just past-focused)
- Tone: {{{tone}}}

**GRATITUDE AUTHENTICITY:**
- Thank-you feels specific and genuine
- Community is center of celebration, not just audience
- Vulnerability creates connection
- Future vision includes everyone

**OUTPUT:** Generate a milestone celebration post that authentically thanks the community and creates shared joy.
      `.trim();

      return {
        finalPrompt: finalPromptMilestone,
        autoFilledFields: {
          postGoal: 'community_building',
          tone: 'inspirational',
          targetAudience: userInput.targetAudience || 'our amazing community',
          callToAction: 'Thank you for being part of our journey!'
        }
      };

    case 'user_spotlight':
      const finalPromptUserSpotlight = `
**USER SPOTLIGHT POST FRAMEWORK**

You are featuring: ${userInput.userName || 'community member'}

**Spotlight Details:**
- Featured User: ${userInput.userName || 'community member'}
- Their Story: ${userInput.userStory || 'amazing achievement'}
- Target Audience: ${userInput.targetAudience || 'our community'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Community: ${userBrandData.brandDescription || 'our community'}

**User Feature Structure:**

1. **INTRODUCTION** - Meet the featured person
   - Introduce ${userInput.userName || 'the featured member'} warmly
   - Share 1-2 key details that make them relatable
   - Create immediate connection: "Meet [name], who..."
   - Make audience curious to learn more

2. **THEIR STORY** - Share the achievement/journey
   - Tell their story: ${userInput.userStory || 'their achievement'}
   - Focus on:
     * Challenge they faced or goal they had
     * How they overcame it or what they achieved
     * Connection to your brand/product/community
   - Make it inspiring yet relatable
   - Use their voice if possible (quotes, perspective)

3. **THE IMPACT** - Show the transformation
   - Highlight the results or transformation
   - Be specific: numbers, before/after, tangible changes
   - Connect to what ${userInput.targetAudience || 'audience'} cares about
   - Show it's possible for others too

4. **SOCIAL PROOF ELEMENT** - Build credibility
   - Brief testimonial aspect (if applicable)
   - What they learned or gained
   - Why they value the brand/community
   - Keep it authentic, not salesy

5. **COMMUNITY INVITATION** - Engage others
   - Congratulate them publicly
   - Invite community to celebrate: "Show [name] some love!"
   - Ask relatable question: "Who else has experienced this?"
   - Create sense of shared community

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Feature photo should humanize the story
- Reference naturally: "Here's [name]...", "In this moment..."
- Visual adds authenticity and personal connection
{{else}}
**TEXT SPOTLIGHT:**
Paint a vivid picture of the person and their journey with words.
Make them come alive through descriptive storytelling.
{{/if}}

**TONE REQUIREMENTS:**
- Genuinely celebratory (NOT exploitative or promotional)
- Humble and community-focused (spotlighting THEM, not you)
- Inspirational yet relatable (NOT unrealistic or exaggerated)
- Tone: {{{tone}}}

**AUTHENTICITY CHECKLIST:**
- Story feels real and specific
- Focus is on THEM, not the brand
- Inspiration is grounded, not hyped
- Community is invited to participate

**OUTPUT:** Generate a user spotlight post that authentically celebrates community members and inspires others.
      `.trim();

      return {
        finalPrompt: finalPromptUserSpotlight,
        autoFilledFields: {
          postGoal: 'community_building',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'our community',
          imageDescription: userInput.userName
            ? `Photo of ${userInput.userName} - community member being featured for ${userInput.userStory || 'their achievement'}`
            : 'Community member spotlight and their success story'
        }
      };

    case 'tutorial_howto':
      const finalPromptTutorial = `
**TUTORIAL / HOW-TO POST FRAMEWORK**

You are teaching: ${userInput.tutorialTopic || 'valuable skill or process'}

**Tutorial Details:**
- Topic: ${userInput.tutorialTopic || 'valuable skill or process'}
- Target Audience: ${userInput.targetAudience || 'people who want to learn'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Expertise: ${userBrandData.industry || 'your expertise area'}

**Educational Tutorial Structure:**

1. **HOOK** - Why this matters
   - Start with the BENEFIT or end result
   - Example: "Want to [achieve X]? Here's exactly how..."
   - Make them understand WHY they should learn this
   - Connect to pain point or desire

2. **WHAT YOU'LL LEARN** - Set expectations
   - Brief overview of what this tutorial covers
   - Time investment: "In under 5 minutes, you'll know how to..."
   - Who this is for: "Perfect for [audience type]"
   - Create confidence that this is achievable

3. **STEP-BY-STEP BREAKDOWN** - The actual teaching
   - Break ${userInput.tutorialTopic || 'the process'} into 3-5 clear steps
   - Number each step for clarity
   - Use action verbs: "First, [verb]...", "Next, [verb]..."
   - Keep each step specific and actionable
   - Example format:
     1. [Step 1 with clear instruction]
     2. [Step 2 with clear instruction]
     3. [Step 3 with clear instruction]

4. **PRO TIPS** - Add expert value
   - Share 1-2 insider tips or common mistakes to avoid
   - Example: "Pro tip: Don't forget to [advice]"
   - This separates beginners from experts
   - Builds your authority

5. **ENCOURAGEMENT & NEXT STEPS** - Motivate action
   - Encourage them to try it
   - Invite questions: "Drop a comment if you need help with step X"
   - Optional: tease the next tutorial in sequence
   - Create momentum

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Use image to illustrate key steps or final result
- Could show: process demonstration, before/after, step-by-step visual
- Reference in steps: "As shown in step 2...", "See the example here..."
{{else}}
**TEXT-BASED TUTORIAL:**
Create crystal-clear written instructions.
Use numbered steps, bullet points, and clear language.
{{/if}}

**TONE REQUIREMENTS:**
- Patient and encouraging (NOT condescending or rushed)
- Confident expert (NOT uncertain or hesitant)
- Accessible and clear (NOT overly technical or jargon-heavy)
- Tone: {{{tone}}}

**CLARITY CHECKLIST:**
- Each step is actionable and specific
- Steps are in logical order
- Common mistakes addressed
- Success criteria clear

**OUTPUT:** Generate a step-by-step tutorial post that empowers the audience to take action and learn the skill.
      `.trim();

      return {
        finalPrompt: finalPromptTutorial,
        autoFilledFields: {
          postGoal: 'informational',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'people who want to learn',
          imageDescription: userInput.tutorialTopic
            ? `Step-by-step visual guide for ${userInput.tutorialTopic}. Show key steps or final result.`
            : 'Step-by-step tutorial demonstration'
        }
      };

    case 'contest_giveaway':
      const finalPromptContest = `
**CONTEST / GIVEAWAY POST FRAMEWORK**

You are announcing a contest with prize: ${userInput.contestPrize || 'exciting prize'}

**Contest Details:**
- Prize: ${userInput.contestPrize || 'exciting prize'}
- Entry Method: ${userInput.entryMethod || 'Enter to win'}
- Target Audience: ${userInput.targetAudience || 'potential participants'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Community: ${userBrandData.brandDescription || 'our community'}

**Contest Announcement Structure:**

1. **ATTENTION GRABBER** - Hook them immediately
   - Lead with excitement: "GIVEAWAY TIME!" or similar
   - Create urgency and FOMO
   - Example: "Who wants to win [prize]? 🎉"
   - Make it scroll-stopping

2. **THE PRIZE** - Make it irresistible
   - Clearly describe: ${userInput.contestPrize || 'the prize'}
   - Emphasize VALUE (monetary or emotional)
   - Make them visualize having/using it
   - Build desirability: "Imagine...", "You could be..."

3. **HOW TO ENTER** - Crystal clear instructions
   - Entry method: ${userInput.entryMethod || 'How to enter'}
   - Break into numbered steps if multiple actions:
     1. [First action]
     2. [Second action]
     3. [Third action]
   - Make it EASY to understand at a glance
   - Remove all confusion about requirements

4. **RULES & DEADLINE** - Essential details
   - When: Contest duration, deadline for entry
   - Who: Eligibility (age, location if applicable)
   - Winner selection: How and when announced
   - Keep it brief but complete
   - Example: "Winner announced [date]. Open to [who]. Good luck!"

5. **EXCITEMENT & ENGAGEMENT** - Build participation
   - Encourage sharing/tagging friends
   - Create community excitement
   - Example: "Tag a friend who needs this!"
   - Build momentum and social proof

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Image should showcase the prize prominently
- Create visual desire and excitement
- Reference: "Look at this amazing prize!", "Here's what you could win..."
{{else}}
**TEXT-FOCUSED CONTEST:**
Paint a vivid picture of the prize with descriptive language.
Create excitement through words and emojis.
{{/if}}

**TONE REQUIREMENTS:**
- Exciting and energetic (NOT desperate or spammy)
- Clear and organized (NOT confusing or misleading)
- Community-focused (NOT manipulative or pushy)
- Tone: {{{tone}}}

**CONTEST BEST PRACTICES:**
- Entry method is simple and clear
- Rules are transparent and fair
- Deadline creates urgency without stress
- Prize is genuinely valuable to audience

**OUTPUT:** Generate an exciting contest/giveaway post with clear rules that drives participation and engagement.
      `.trim();

      return {
        finalPrompt: finalPromptContest,
        autoFilledFields: {
          postGoal: 'promotion',
          tone: 'professional',
          targetAudience: userInput.targetAudience || 'potential participants',
          callToAction: userInput.entryMethod || 'Enter to win! Follow the steps above.',
          imageDescription: userInput.contestPrize
            ? `Eye-catching photo showcasing the prize: ${userInput.contestPrize}. Make it look desirable.`
            : 'Contest prize showcase - make it look exciting and valuable'
        }
      };

    case 'seasonal_timely':
      const finalPromptSeasonal = `
**SEASONAL / TIMELY POST FRAMEWORK**

You are creating timely content for: ${userInput.occasion || 'seasonal event'}

**Seasonal Context:**
- Occasion/Season: ${userInput.occasion || 'seasonal event'}
- Brand Connection: ${userInput.brandConnection || 'how it relates to brand'}
- Target Audience: ${userInput.targetAudience || 'seasonal shoppers'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Products/Services: ${userBrandData.brandDescription || 'your offerings'}

**Seasonal Content Structure:**

1. **SEASONAL HOOK** - Connect to the moment
   - Reference ${userInput.occasion || 'the season/event'} immediately
   - Tap into current feelings/experiences
   - Examples: "It's officially [season]...", "[Holiday] is here and we're feeling..."
   - Create timely relevance

2. **EMOTIONAL CONNECTION** - Tap into the mood
   - What does this season/event MEAN to people?
   - Connect emotionally to memories, traditions, feelings
   - Make it personal and relatable
   - Example: "There's something magical about..."

3. **BRAND RELEVANCE** - Natural connection
   - Bridge from season to brand: ${userInput.brandConnection || 'your connection'}
   - Show how your product/service fits THIS moment
   - Don't force it - make it feel natural
   - Example: "This is the perfect time for..."

4. **OFFER OR VALUE** - Give them something
   - Seasonal tip, product recommendation, special offer
   - Make it useful for RIGHT NOW
   - Could be: seasonal use case, limited offer, timely advice
   - Add value, don't just sell

5. **SEASONAL CTA** - Timely action
   - Create urgency tied to the season/event
   - Example: "Make this [season] special with...", "Don't miss out this [holiday]..."
   - Time-bound momentum

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Image should evoke the season/occasion visually
- Colors, themes, symbols tied to ${userInput.occasion || 'the season'}
- Reference: "Just like in this [seasonal moment]...", "This captures the [feeling]..."
{{else}}
**TEXT-ONLY SEASONAL:**
Use vivid, sensory language to evoke the season.
Paint the picture with words: colors, feelings, traditions.
{{/if}}

**TONE REQUIREMENTS:**
- Timely and relevant (NOT forced or out of touch)
- Warm and festive (appropriate to ${userInput.occasion || 'season'})
- Authentic brand voice (NOT generic seasonal spam)
- Tone: {{{tone}}}

**SEASONAL RELEVANCE CHECKLIST:**
- Connection to season feels natural, not forced
- Brand fit is clear and authentic
- Timing creates appropriate urgency
- Value proposition is season-specific

**OUTPUT:** Generate a seasonal/timely post that authentically connects the brand to the moment while providing value.
      `.trim();

      return {
        finalPrompt: finalPromptSeasonal,
        autoFilledFields: {
          postGoal: 'storytelling',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'seasonal shoppers',
          imageDescription: userInput.occasion
            ? `Seasonal imagery for ${userInput.occasion}. ${userInput.brandConnection || 'Connect to brand naturally.'}`
            : 'Seasonal or timely visual that connects to the brand'
        }
      };

    case 'customer_review_post':
      const finalPromptReview = `
**CUSTOMER REVIEW POST FRAMEWORK**

You are sharing customer feedback: ${userInput.reviewHighlight || 'positive customer experience'}

**Review Details:**
- Review Highlight: ${userInput.reviewHighlight || 'positive customer experience'}
- Customer: ${userInput.customerName || 'valued customer'}
- Target Audience: ${userInput.targetAudience || 'potential customers'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- What We Offer: ${userBrandData.brandDescription || 'our products/services'}

**Customer Review Post Structure:**

1. **SOCIAL PROOF HOOK** - Lead with credibility
   - Start with the impact: "Our customers are saying...", "[X] people love..."
   - Create immediate interest
   - Signal that real people have real experiences
   - Build trust from line one

2. **THE REVIEW HIGHLIGHT** - Share the feedback
   - Feature: ${userInput.reviewHighlight || 'the key customer feedback'}
   - Use quotation marks if it's a direct quote
   - Keep it authentic and specific (not generic praise)
   - Example: "[Customer] shared: 'This changed how I...' "
   - Show real transformation or benefit

3. **THE CONTEXT** - What led to this review
   - What product/service are they reviewing?
   - What problem did it solve for them?
   - What makes this feedback meaningful?
   - Connect to ${userInput.targetAudience || 'potential customers'} needs

4. **RELATABLE ELEMENT** - Make it relevant
   - How does this apply to YOUR audience?
   - Example: "If you've been struggling with [problem]..."
   - Create connection: "Maybe you can relate..."
   - Show it's not just one person's experience

5. **SOFT CTA** - Invite without pushing
   - Don't hard sell - let the review do the work
   - Example: "Want to experience this too?", "See what others are saying..."
   - Or ask: "What's your experience been?"
   - Keep it conversational

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Could show: customer photo, product in use, review screenshot, testimonial graphic
- Reference naturally: "Here's what [customer] had to say...", "Real feedback from real people..."
- Visual adds authenticity and proof
{{else}}
**TEXT-BASED REVIEW:**
Present the review with clear formatting.
Use quotation marks, attributions, and emphasis to make it stand out.
{{/if}}

**TONE REQUIREMENTS:**
- Grateful and humble (NOT boastful or arrogant)
- Authentic and real (NOT manufactured or fake)
- Customer-focused (NOT brand-centric bragging)
- Tone: {{{tone}}}

**AUTHENTICITY SIGNALS:**
- Review sounds genuine, not scripted
- Specific details make it credible
- Focus is on customer benefit, not brand promotion
- Invitation is soft, not pushy

**OUTPUT:** Generate a customer review post that builds trust through authentic social proof while staying humble and customer-focused.
      `.trim();

      return {
        finalPrompt: finalPromptReview,
        autoFilledFields: {
          postGoal: 'community_building',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'potential customers',
          imageDescription: userInput.customerName
            ? `Customer testimonial graphic featuring feedback from ${userInput.customerName}. ${userInput.reviewHighlight || 'Show authenticity.'}`
            : 'Customer review or testimonial - make it look authentic and credible'
        }
      };

    case 'behind_the_scenes':
      const finalPromptBTS = `
**BEHIND-THE-SCENES POST FRAMEWORK**

You are sharing an authentic behind-the-scenes moment: ${userInput.processDescription || 'brand process'}

**BTS Details:**
- Process/Moment: ${userInput.processDescription || 'behind-the-scenes moment'}
- Target Audience: ${userInput.targetAudience || 'curious followers'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- What We Do: ${userBrandData.brandDescription || 'our work'}

**Authenticity-Focused Structure:**

1. **PULL BACK THE CURTAIN** - Invite them in
   - Start with vulnerability or transparency
   - Examples: "Here's what you don't usually see...", "Behind every [product] is...", "Want to see how we actually..."
   - Create curiosity and exclusivity
   - Make them feel like insiders

2. **THE MOMENT/PROCESS** - Show the reality
   - Describe: ${userInput.processDescription || 'the behind-the-scenes moment'}
   - Be honest about:
     * The effort, time, or challenges involved
     * The people behind the work
     * The "messy middle" of creation
   - Avoid overly polished presentation - embrace authenticity
   - Show the human side

3. **WHY IT MATTERS** - Connect to purpose
   - Why does this process/moment matter?
   - How does it connect to your values or quality?
   - What does it reveal about your brand's commitment?
   - Example: "We do this because...", "This matters to us because..."

4. **HUMANIZE & RELATE** - Build connection
   - Share a relatable challenge or learning moment
   - Show vulnerability: "It's not always perfect...", "We're learning as we go..."
   - Make ${userInput.targetAudience || 'followers'} see the real people
   - Create empathy and understanding

5. **INVITATION TO ENGAGE** - Include them
   - Ask about their experience: "Ever wonder how [X] is made?"
   - Invite questions: "What else would you like to see?"
   - Create dialogue, not just broadcast
   - Make them part of the journey

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Image reveals the actual process, workspace, or team in action
- Reference naturally: "As you can see here...", "This is what it really looks like..."
- Let the visual show authenticity - no need to over-explain
- Create synergy between candid visual and honest caption
{{else}}
**TEXT-ONLY BTS:**
Paint a vivid picture with descriptive language.
Help them visualize the process, environment, people involved.
{{/if}}

**TONE REQUIREMENTS:**
- Authentic and vulnerable (NOT polished or corporate)
- Warm and inviting (NOT distant or formal)
- Humble about the process (NOT boastful)
- Tone: {{{tone}}}

**AUTHENTICITY SIGNALS:**
- Honesty about challenges or imperfections
- Real people and real moments highlighted
- Vulnerability creates trust
- Invitation feels genuine

**OUTPUT:** Generate an authentic behind-the-scenes post that humanizes the brand and builds deeper connection.
      `.trim();

      return {
        finalPrompt: finalPromptBTS,
        autoFilledFields: {
          postGoal: 'storytelling',
          tone: 'friendly',
          targetAudience: userInput.targetAudience || 'curious followers',
          callToAction: 'What would you like to see next?',
          imageDescription: userInput.processDescription
            ? `Behind-the-scenes view of ${userInput.processDescription}. Show the authentic process, workspace, or team in action.`
            : 'Behind-the-scenes moment showing the real process or people behind the brand'
        }
      };

    case 'flash_sale':
      const finalPromptFlashSale = `
**FLASH SALE / LIMITED OFFER FRAMEWORK**

You are announcing a time-sensitive offer: ${userInput.offerDetails || 'special limited offer'}

**Offer Details:**
- Promotion: ${userInput.offerDetails || 'special offer'}
- Time Limit: ${userInput.timeLimit || 'limited time'}
- Target Audience: ${userInput.targetAudience || 'customers'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- Products/Services: ${userBrandData.brandDescription || 'our offerings'}

**Urgency-Driven Structure:**

1. **URGENT HOOK** - Stop the scroll immediately
   - Lead with time pressure or scarcity
   - Examples: "FLASH SALE ALERT!", "You have [X] hours...", "URGENT: This won't last..."
   - Create immediate FOMO (Fear of Missing Out)
   - Make them pause and read

2. **THE OFFER** - Crystal clear value
   - State the offer clearly: ${userInput.offerDetails || 'the promotion'}
   - Emphasize the VALUE and savings
   - Make it tangible: specific percentages, dollar amounts, quantities
   - Example: "Save 30% on EVERYTHING" or "Buy 2, Get 1 FREE"
   - No confusion - they should understand instantly

3. **TIME PRESSURE** - Create urgency
   - Deadline: ${userInput.timeLimit || 'limited time'}
   - Be specific: exact time, countdown, "only X hours left"
   - Examples: "Ends tonight at 11:59 PM", "24 hours only", "While supplies last"
   - Create tension without being pushy
   - Make them act NOW, not later

4. **WHY THIS OFFER** - Build credibility
   - Brief context: Why are you running this sale?
   - Examples: "Celebrating [milestone]", "Making room for new inventory", "Customer appreciation"
   - Avoid appearing desperate - frame positively
   - Build excitement, not suspicion

5. **CLEAR CALL-TO-ACTION** - Remove friction
   - Tell them EXACTLY what to do
   - Examples: "Shop now via link in bio", "Use code FLASH30 at checkout", "DM us to claim"
   - Make it easy and obvious
   - Create momentum toward conversion
   - Remove any barriers

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Image should visually communicate urgency (countdown, sale graphics, products)
- Reference: "Look at these deals!", "This is what you can save on..."
- Create visual excitement and FOMO
{{else}}
**TEXT-ONLY URGENCY:**
Use bold formatting, emojis, and strong language to create urgency.
Paint the picture of value and limited opportunity.
{{/if}}

**TONE REQUIREMENTS:**
- Urgent but not desperate (create excitement, not panic)
- Clear and direct (NO confusing language)
- Enthusiastic without being salesy or pushy
- Tone: {{{tone}}}

**URGENCY BEST PRACTICES:**
- Offer is clear and valuable
- Deadline is specific and credible
- CTA removes all friction
- Excitement is authentic, not manufactured

**OUTPUT:** Generate a high-converting flash sale post that creates genuine urgency and drives immediate action.
      `.trim();

      return {
        finalPrompt: finalPromptFlashSale,
        autoFilledFields: {
          postGoal: 'promotion',
          tone: 'professional',
          targetAudience: userInput.targetAudience || 'customers',
          callToAction: 'Shop now before it ends!',
          imageDescription: userInput.offerDetails
            ? `Eye-catching sale graphic for ${userInput.offerDetails}. Show urgency, value, and time limit. ${userInput.timeLimit || 'Limited time offer'}`
            : 'Flash sale announcement - create visual urgency and excitement'
        }
      };

    case 'before_after':
      const finalPromptBeforeAfter = `
**BEFORE/AFTER TRANSFORMATION FRAMEWORK**

You are showcasing a transformation: ${userInput.transformationType || 'impressive results'}

**Transformation Details:**
- What Changed: ${userInput.transformationType || 'transformation'}
- Results: ${userInput.resultsAchieved || 'significant improvement'}
- Target Audience: ${userInput.targetAudience || 'people with similar goals'}

**Brand Context:**
- Brand: ${userBrandData.brandName || 'your brand'}
- How We Help: ${userBrandData.brandDescription || 'what we offer'}

**Results-Focused Structure:**

1. **THE HOOK** - Show the transformation immediately
   - Lead with the dramatic change or result
   - Examples: "30 days. This is what happened...", "From [before state] to [after state]", "The transformation speaks for itself..."
   - Create immediate visual or emotional impact
   - Make them want to know HOW

2. **THE BEFORE** - Set the starting point
   - Describe the initial situation/problem/state
   - Be honest about challenges faced
   - Make it relatable to ${userInput.targetAudience || 'your audience'}
   - Example: "Where we started: [specific situation]"
   - Create context for the transformation

3. **THE JOURNEY** - Bridge before and after
   - What changed? What was the process?
   - Time investment: days, weeks, months
   - Brief mention of: method, product used, approach taken
   - Keep it honest - acknowledge effort required
   - Example: "Over [timeframe], using [method/product]..."

4. **THE AFTER** - Celebrate the results
   - Specific results: ${userInput.resultsAchieved || 'the improvements'}
   - Use numbers, metrics, tangible outcomes
   - Show the IMPACT of the transformation
   - Examples: "Now: [specific improvements]", "The result: [measurable change]"
   - Make it credible with specifics

5. **SOCIAL PROOF + HOPE** - Make it relatable
   - Connect to how your brand/product enabled this
   - Make it feel achievable for others
   - "If [person/situation] can do it, so can you"
   - Invite questions or sharing: "Want to know how?"
   - Create inspiration, not intimidation

{{#if imageDescription}}
**VISUAL INTEGRATION:**
The accompanying image shows: {{{imageDescription}}}

**How to use the visual:**
- Image should show clear before/after comparison
- Reference the visual: "Look at the difference...", "The image tells the story..."
- Let the visual do heavy lifting for proof
- Caption should add context, emotion, and credibility
{{else}}
**TEXT-ONLY TRANSFORMATION:**
Use descriptive language to paint before/after picture.
Make the transformation vivid and tangible with specific details.
{{/if}}

**TONE REQUIREMENTS:**
- Inspirational yet realistic (NOT hyped or exaggerated)
- Proof-focused with specifics (NOT vague claims)
- Humble and relatable (NOT boastful or unrealistic)
- Tone: {{{tone}}}

**CREDIBILITY CHECKLIST:**
- Specific metrics and results provided
- Timeframe is realistic and honest
- Process/method is acknowledged
- Transformation feels achievable

**OUTPUT:** Generate a transformation post that inspires through authentic proof and makes success feel achievable.
      `.trim();

      return {
        finalPrompt: finalPromptBeforeAfter,
        autoFilledFields: {
          postGoal: 'community_building',
          tone: 'inspirational',
          targetAudience: userInput.targetAudience || 'people with similar goals',
          callToAction: 'Want to see results like this?',
          imageDescription: userInput.transformationType
            ? `Before/After comparison showing ${userInput.transformationType}. Clear visual proof of ${userInput.resultsAchieved || 'transformation'}.`
            : 'Before and after transformation - show clear visual proof of results'
        }
      };

    default:
      // Fallback for social templates without specific case handlers
      // Use template presets to ensure fields are always defined
      console.warn(`Social template ID "${template.id}" does not have a specific case handler. Using generic template presets.`);
      return {
        finalPrompt: `Create an engaging social media post for: ${userBrandData.brandName || 'brand'}.\n\nBrand: ${userBrandData.brandDescription || 'Professional brand'}\nIndustry: ${userBrandData.industry || 'General'}`,
        autoFilledFields: {
          postGoal: template.presets.postGoal,
          tone: template.presets.tone,
          platform: template.presets.platform,
          targetAudience: 'target audience',
          callToAction: 'Learn more'
        }
      };
  }
}

// ============================================
// UNIVERSAL TEMPLATES (26 total - optimized for quality AI output)
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
  },
  {
    id: 'behind_the_scenes',
    name: 'Behind-the-Scenes',
    icon: '🎬',
    description: 'Showcase your process, team, or journey to humanize your brand',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'storytelling',
      tone: 'friendly',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'processDescription',
        label: 'What behind-the-scenes moment are you sharing?',
        placeholder: 'e.g., Creating our new product, Team working on a project',
        type: 'textarea',
        maxLength: 200
      },
      {
        key: 'targetAudience',
        label: 'Who will appreciate this?',
        placeholder: 'e.g., curious customers, aspiring entrepreneurs',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '30 seconds',
    premium: false,
    tags: ['behind-the-scenes', 'authentic', 'process', 'transparency', 'humanize']
  },
  {
    id: 'flash_sale',
    name: 'Flash Sale / Limited Offer',
    icon: '⚡',
    description: 'Create urgency with time-sensitive promotions and offers',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'promotion',
      tone: 'professional',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'offerDetails',
        label: 'What is the offer?',
        placeholder: 'e.g., 30% off everything, Buy 1 Get 1 Free',
        type: 'text',
        maxLength: 150
      },
      {
        key: 'timeLimit',
        label: 'Time limit or deadline',
        placeholder: 'e.g., 24 hours only, Ends tonight at midnight',
        type: 'text',
        maxLength: 100
      },
      {
        key: 'targetAudience',
        label: 'Target audience',
        placeholder: 'e.g., loyal customers, new shoppers',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '25 seconds',
    premium: false,
    tags: ['sale', 'urgency', 'promotion', 'limited', 'offer', 'conversion']
  },
  {
    id: 'before_after',
    name: 'Before/After Transformation',
    icon: '🔄',
    description: 'Showcase results and transformations with proof-focused content',
    category: 'social',
    industries: null,
    presets: {
      postGoal: 'community_building',
      tone: 'inspirational',
      platform: 'all'
    },
    requiredUserInputs: [
      {
        key: 'transformationType',
        label: 'What transformation are you showing?',
        placeholder: 'e.g., Skin transformation after 30 days, Business growth in 6 months',
        type: 'textarea',
        maxLength: 200
      },
      {
        key: 'resultsAchieved',
        label: 'Specific results or improvements',
        placeholder: 'e.g., Clearer skin, 5x revenue growth, 20 lbs lost',
        type: 'text',
        maxLength: 150
      },
      {
        key: 'targetAudience',
        label: 'Who will relate to this?',
        placeholder: 'e.g., people with similar goals, potential customers',
        type: 'text',
        maxLength: 100
      }
    ],
    estimatedTime: '35 seconds',
    premium: false,
    tags: ['transformation', 'results', 'proof', 'before-after', 'success', 'testimonial']
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
