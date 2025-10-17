/**
 * Brand Profile Templates for Solopreneurs, Small Businesses, and Startups
 *
 * These templates provide pre-filled brand profile data to help users get started quickly.
 * Each template targets specific industries common among solopreneurs and small business owners.
 */

export interface BrandTemplate {
  id: string;
  name: string;
  icon: string;
  category: 'Professional Services' | 'Food & Beverage' | 'Health & Wellness' | 'Retail & E-commerce' | 'Creative & Marketing' | 'Technology' | 'Lifestyle' | 'Content & Media' | 'Beauty & Personal Care' | 'Pet Services' | 'Events & Entertainment' | 'Education';
  brandDescription: string;
  industry: string;
  imageStyleNotes: string;
  targetKeywords: string;
  logoType?: 'logomark' | 'logotype' | 'monogram';
  logoShape?: 'circle' | 'square' | 'shield' | 'hexagon' | 'diamond' | 'custom';
  logoStyle?: 'minimalist' | 'modern' | 'classic' | 'playful' | 'bold' | 'elegant';
  logoColors?: string;
}

export const brandTemplates: Record<string, BrandTemplate> = {
  // TIER 1: Creator Economy & Content (Highest trending for solopreneurs)
  content_creator: {
    id: 'content_creator',
    name: 'Content Creator',
    icon: '🎥',
    category: 'Content & Media',
    brandDescription: 'A creative content creator and influencer building an engaged community through authentic storytelling, valuable content, and consistent brand presence across social media platforms.',
    industry: 'arts_entertainment',
    imageStyleNotes: 'Behind-the-scenes content creation, camera and recording equipment, engaging thumbnail designs, lifestyle shots, authentic moments, dynamic angles, vibrant and eye-catching colors, brand-consistent aesthetic, social media graphics, personality-driven imagery',
    targetKeywords: 'content creator, influencer, YouTube, social media content, video creator, digital creator, online personality, content strategy, brand partnerships',
    logoType: 'logotype',
    logoShape: 'custom',
    logoStyle: 'bold',
    logoColors: 'Vibrant red, electric blue, white',
  },

  online_course_creator: {
    id: 'online_course_creator',
    name: 'Online Course Creator',
    icon: '📚',
    category: 'Education',
    brandDescription: 'An expert educator creating comprehensive online courses and digital learning experiences that empower students to master new skills and achieve their learning goals.',
    industry: 'education',
    imageStyleNotes: 'Professional teaching setup, laptop and online learning environments, course materials and workbooks, student success stories, educational infographics, professional yet approachable aesthetic, trust-building imagery, lesson screenshots, certificate designs',
    targetKeywords: 'online courses, digital learning, online education, course creator, e-learning, skill development, online training, educational content, course platform',
    logoType: 'logotype',
    logoShape: 'square',
    logoStyle: 'modern',
    logoColors: 'Academic blue, gold, white',
  },

  social_media_manager: {
    id: 'social_media_manager',
    name: 'Social Media Manager',
    icon: '📱',
    category: 'Creative & Marketing',
    brandDescription: 'A skilled social media manager helping brands grow their online presence through strategic content creation, community engagement, and data-driven social media marketing campaigns.',
    industry: 'other',
    imageStyleNotes: 'Social media interface mockups, content creation process, analytics dashboards, phone and laptop screens, trending content examples, engagement metrics, colorful and dynamic layouts, behind-the-scenes content creation, social platform logos',
    targetKeywords: 'social media manager, content creation, social media marketing, Instagram growth, digital marketing, brand engagement, social strategy, online presence',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'modern',
    logoColors: 'Vibrant pink, purple, blue gradient',
  },

  // TIER 2: Freelance & Creative Services (High solopreneur demand)
  freelance_designer: {
    id: 'freelance_designer',
    name: 'Freelance Designer',
    icon: '🎨',
    category: 'Creative & Marketing',
    brandDescription: 'A creative freelance graphic designer specializing in brand identity, web design, and visual storytelling for small businesses and entrepreneurs who want to make a lasting impression.',
    industry: 'arts_entertainment',
    imageStyleNotes: 'Portfolio showcase imagery, design process shots, creative workspace, color palettes, typography samples, before/after design comparisons, vibrant creative colors, artistic compositions, design software screenshots',
    targetKeywords: 'graphic designer, freelance designer, brand identity, logo design, web design, creative services, visual design, design portfolio',
    logoType: 'monogram',
    logoShape: 'square',
    logoStyle: 'modern',
    logoColors: 'Purple, teal, coral',
  },

  web_developer: {
    id: 'web_developer',
    name: 'Web Developer',
    icon: '⚡',
    category: 'Technology',
    brandDescription: 'A professional web developer specializing in building fast, responsive, and user-friendly websites and web applications for businesses looking to establish a powerful online presence.',
    industry: 'technology_saas',
    imageStyleNotes: 'Code on screen, modern workstation setup, website mockups, responsive design examples, clean UI/UX designs, technology stack logos, development process, laptop with code, abstract tech patterns, developer workspace, dark mode aesthetics',
    targetKeywords: 'web developer, website development, web design, responsive websites, web applications, frontend developer, custom websites, professional web development',
    logoType: 'monogram',
    logoShape: 'square',
    logoStyle: 'minimalist',
    logoColors: 'Electric blue, dark gray, white',
  },

  photography_studio: {
    id: 'photography_studio',
    name: 'Photography Studio',
    icon: '📸',
    category: 'Creative & Marketing',
    brandDescription: 'A creative photography studio capturing life\'s precious moments through portrait, event, and commercial photography with an artistic eye and professional expertise.',
    industry: 'arts_entertainment',
    imageStyleNotes: 'Beautiful photography portfolio pieces, behind-the-scenes shoots, camera equipment, studio lighting setups, diverse photo subjects (portraits, products, events), artistic compositions, professional photo editing, natural and studio settings',
    targetKeywords: 'photography studio, professional photographer, portrait photography, event photography, commercial photography, photo sessions, creative photography, photography services',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'modern',
    logoColors: 'Black, white, camera lens silver',
  },

  // TIER 3: E-commerce & Retail (Growing online business trend)
  online_boutique: {
    id: 'online_boutique',
    name: 'Online Boutique',
    icon: '👗',
    category: 'Retail & E-commerce',
    brandDescription: 'A curated online fashion boutique offering stylish, high-quality clothing and accessories for modern, fashion-forward individuals who value unique style and quality craftsmanship.',
    industry: 'fashion_apparel',
    imageStyleNotes: 'Fashion-forward photography, clean product shots on white/neutral backgrounds, lifestyle imagery, flat lays, outfit combinations, texture close-ups, elegant and sophisticated aesthetic, soft natural lighting, pastel and neutral tones',
    targetKeywords: 'online boutique, fashion, women\'s clothing, trendy style, curated fashion, quality apparel, contemporary style, boutique shopping',
    logoType: 'logotype',
    logoShape: 'custom',
    logoStyle: 'elegant',
    logoColors: 'Black, gold, blush pink',
  },

  handmade_jewelry: {
    id: 'handmade_jewelry',
    name: 'Handmade Jewelry',
    icon: '💎',
    category: 'Retail & E-commerce',
    brandDescription: 'A unique jewelry brand creating beautiful, handcrafted pieces that blend artisan craftsmanship with contemporary design, perfect for those who appreciate one-of-a-kind accessories.',
    industry: 'fashion_apparel',
    imageStyleNotes: 'Elegant product photography, jewelry close-ups, lifestyle shots worn on models, artisan workspace, craft process, gemstones and materials, soft natural lighting, luxury aesthetic, flat lays on marble or fabric, detail shots, packaging',
    targetKeywords: 'handmade jewelry, artisan jewelry, unique accessories, custom jewelry, handcrafted, jewelry design, statement pieces, boutique jewelry',
    logoType: 'logotype',
    logoShape: 'diamond',
    logoStyle: 'elegant',
    logoColors: 'Rose gold, black, white',
  },

  // TIER 4: Beauty & Wellness Services (Popular local services)
  beauty_salon: {
    id: 'beauty_salon',
    name: 'Beauty Salon',
    icon: '💅',
    category: 'Beauty & Personal Care',
    brandDescription: 'A modern beauty salon offering professional hair styling, nail care, and beauty treatments in a luxurious, welcoming environment where clients feel pampered and confident.',
    industry: 'beauty_cosmetics',
    imageStyleNotes: 'Glamorous before/after transformations, beauty product close-ups, salon interior with elegant lighting, hair styling process, manicure and nail art, makeup application, luxurious textures, soft feminine colors (rose gold, blush pink, ivory), professional tools, client satisfaction moments',
    targetKeywords: 'beauty salon, hair salon, nail salon, beauty treatments, hair styling, manicures, beauty services, salon experience, professional beauty',
    logoType: 'logotype',
    logoShape: 'custom',
    logoStyle: 'elegant',
    logoColors: 'Rose gold, blush pink, black',
  },

  fitness_coach: {
    id: 'fitness_coach',
    name: 'Fitness Coach',
    icon: '🏋️',
    category: 'Health & Wellness',
    brandDescription: 'A certified fitness coach and wellness expert helping clients achieve their health goals through personalized training programs, nutrition guidance, and sustainable lifestyle changes.',
    industry: 'health_wellness',
    imageStyleNotes: 'Energetic and motivating imagery, active lifestyle shots, gym equipment, outdoor workouts, healthy food, transformation visuals, bright and vibrant colors (orange, green, blue), inspirational quotes overlays, before/after concepts',
    targetKeywords: 'personal trainer, fitness coach, weight loss, strength training, wellness, healthy lifestyle, fitness transformation, workout plans, nutrition coaching',
    logoType: 'logomark',
    logoShape: 'shield',
    logoStyle: 'bold',
    logoColors: 'Energetic orange, fitness green, black',
  },

  yoga_studio: {
    id: 'yoga_studio',
    name: 'Yoga Studio',
    icon: '🧘',
    category: 'Health & Wellness',
    brandDescription: 'A peaceful yoga studio offering mindful movement classes, meditation sessions, and wellness workshops in a supportive community environment for all experience levels.',
    industry: 'health_wellness',
    imageStyleNotes: 'Calming and serene imagery, yoga poses, meditation scenes, natural elements (plants, water, stones), soft lighting, peaceful studio spaces, wellness lifestyle, pastel colors (lavender, sage green, soft pink), zen aesthetics, mindfulness visuals',
    targetKeywords: 'yoga studio, yoga classes, meditation, wellness, mindfulness, yoga practice, holistic health, yoga community, stress relief',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'minimalist',
    logoColors: 'Sage green, lavender, cream',
  },

  pet_services: {
    id: 'pet_services',
    name: 'Pet Care Services',
    icon: '🐾',
    category: 'Pet Services',
    brandDescription: 'A trusted pet care service providing loving care, professional grooming, training, and pet sitting services for furry family members while their owners are away or busy.',
    industry: 'other',
    imageStyleNotes: 'Happy pets and satisfied owners, cute animals in action, grooming process, playful moments, pet-friendly environments, bright and cheerful colors, trust and care imagery, before/after grooming shots, pet accessories, outdoor pet activities',
    targetKeywords: 'pet grooming, dog grooming, pet sitting, pet care, dog walking, pet services, animal care, professional groomer, pet spa',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'playful',
    logoColors: 'Playful orange, sky blue, white',
  },

  // TIER 5: Professional Services
  life_coach: {
    id: 'life_coach',
    name: 'Life Coach',
    icon: '🌟',
    category: 'Professional Services',
    brandDescription: 'An empowering life coach dedicated to helping individuals discover their purpose, overcome obstacles, and create meaningful positive change in their personal and professional lives.',
    industry: 'other',
    imageStyleNotes: 'Inspirational and uplifting imagery, natural landscapes, sunrise/sunset, journey metaphors, coaching sessions, journaling, goal-setting visuals, motivational quotes, warm and inviting tones, personal growth symbolism, peaceful environments',
    targetKeywords: 'life coach, personal development, life transformation, coaching services, goal achievement, self-improvement, mindset coaching, personal growth, life purpose',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'elegant',
    logoColors: 'Gold, teal, white',
  },

  consulting_business: {
    id: 'consulting_business',
    name: 'Business Consultant',
    icon: '💼',
    category: 'Professional Services',
    brandDescription: 'An experienced business consultant providing strategic guidance, operational expertise, and actionable insights to help small businesses and startups scale efficiently and achieve sustainable growth.',
    industry: 'other',
    imageStyleNotes: 'Professional corporate imagery, business meetings, strategy sessions, charts and analytics, office environments, professional headshots, handshakes, modern workspace, laptop and documents, success-oriented visuals',
    targetKeywords: 'business consultant, strategy consulting, business growth, operational efficiency, startup advisor, business coaching, management consulting, strategic planning',
    logoType: 'logotype',
    logoShape: 'square',
    logoStyle: 'classic',
    logoColors: 'Corporate blue, gray, white',
  },

  real_estate_agent: {
    id: 'real_estate_agent',
    name: 'Real Estate Agent',
    icon: '🏠',
    category: 'Professional Services',
    brandDescription: 'A trusted real estate professional helping families and individuals find their dream homes and investment properties with personalized service, local market expertise, and dedicated support.',
    industry: 'real_estate',
    imageStyleNotes: 'Professional property photos, exterior and interior home shots, neighborhood imagery, happy family moments, keys and contracts, modern homes, luxury details, warm and inviting lighting, professional headshots, sold signs',
    targetKeywords: 'real estate agent, property listings, home buying, real estate services, local realtor, property investment, dream home, trusted agent',
    logoType: 'logomark',
    logoShape: 'hexagon',
    logoStyle: 'classic',
    logoColors: 'Navy blue, gold, white',
  },

  event_planner: {
    id: 'event_planner',
    name: 'Event Planner',
    icon: '🎉',
    category: 'Events & Entertainment',
    brandDescription: 'A creative event planning service bringing dream celebrations to life through meticulous attention to detail, innovative design, and flawless execution for weddings, corporate events, and special occasions.',
    industry: 'other',
    imageStyleNotes: 'Beautiful event setups, elegant table settings, floral arrangements, venue decorations, happy celebration moments, event details (invitations, centerpieces), sophisticated color palettes, luxury and elegance, behind-the-scenes planning, client testimonials with event photos',
    targetKeywords: 'event planner, wedding planner, event planning, party planning, corporate events, event design, celebration planning, event coordination, special occasions',
    logoType: 'logotype',
    logoShape: 'custom',
    logoStyle: 'elegant',
    logoColors: 'Champagne gold, navy blue, white',
  },

  // TIER 6: Tech & Startups
  tech_startup: {
    id: 'tech_startup',
    name: 'Tech Startup',
    icon: '💻',
    category: 'Technology',
    brandDescription: 'An innovative technology startup building cutting-edge software solutions that solve real problems for modern businesses and forward-thinking consumers.',
    industry: 'technology_saas',
    imageStyleNotes: 'Modern and clean aesthetic, tech blue and white color scheme, abstract geometric shapes, futuristic elements, gradient backgrounds, minimalist design, professional workspace shots, technology devices, innovation-focused imagery',
    targetKeywords: 'innovation, technology, software, digital solutions, startup, tech innovation, SaaS, modern technology, digital transformation',
    logoType: 'logotype',
    logoShape: 'square',
    logoStyle: 'minimalist',
    logoColors: 'Tech blue, white, accent cyan',
  },

  // TIER 7: Food & Beverage (Traditional businesses)
  coffee_shop: {
    id: 'coffee_shop',
    name: 'Coffee Shop',
    icon: '☕',
    category: 'Food & Beverage',
    brandDescription: 'A welcoming neighborhood coffee shop that serves artisan coffee and creates a warm community gathering space for coffee enthusiasts, remote workers, and local residents.',
    industry: 'food_beverage',
    imageStyleNotes: 'Warm earth tones (browns, creams, warm whites), coffee beans, latte art, rustic wood textures, cozy interior shots, steam rising from cups, natural lighting, Instagram-worthy flat lays, coffee-making process, friendly barista interactions',
    targetKeywords: 'artisan coffee, specialty coffee, community café, local coffee shop, coffee culture, freshly roasted, cozy atmosphere, coffee lovers',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'modern',
    logoColors: 'Brown, cream, warm orange',
  },

  bakery: {
    id: 'bakery',
    name: 'Artisan Bakery',
    icon: '🥐',
    category: 'Food & Beverage',
    brandDescription: 'A charming artisan bakery crafting fresh, handmade breads, pastries, and desserts daily using traditional techniques and high-quality, locally-sourced ingredients.',
    industry: 'food_beverage',
    imageStyleNotes: 'Delicious food photography, fresh baked goods, rustic presentation, warm golden tones, flour dust, baking process, oven shots, display cases, artisan details, close-up textures, vintage bakery aesthetic, natural morning light',
    targetKeywords: 'artisan bakery, fresh bread, handmade pastries, local bakery, sourdough, fresh baked goods, traditional baking, homemade desserts',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'classic',
    logoColors: 'Warm brown, cream, wheat gold',
  },

  meal_prep_service: {
    id: 'meal_prep_service',
    name: 'Meal Prep Service',
    icon: '🍱',
    category: 'Food & Beverage',
    brandDescription: 'A healthy meal prep delivery service providing nutritious, chef-prepared meals that make eating well convenient for busy professionals and health-conscious individuals.',
    industry: 'food_beverage',
    imageStyleNotes: 'Fresh healthy meals, colorful vegetables, meal prep containers, organized meal layouts, nutritious ingredients, kitchen preparation, portion control, balanced plates, vibrant food colors, clean eating aesthetic, fresh produce, professional food styling',
    targetKeywords: 'meal prep service, healthy meals, meal delivery, nutrition, prepared meals, healthy eating, convenient food, balanced nutrition, meal planning',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'modern',
    logoColors: 'Fresh green, orange, white',
  },

  // NEW ADDITIONS - High-value templates for AI content generation
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    category: 'Food & Beverage',
    brandDescription: 'A welcoming restaurant serving delicious cuisine in a warm, inviting atmosphere where every dish tells a story and every guest becomes part of the family.',
    industry: 'food_beverage',
    imageStyleNotes: 'Mouth-watering food photography, plated dishes with garnish, restaurant ambiance shots, chef in action, ingredient close-ups, table settings, warm lighting, appetizing colors, food texture details, dining experience moments, bar and drinks, outdoor seating vibes',
    targetKeywords: 'restaurant, dining, food, cuisine, chef, menu, local restaurant, food experience, culinary, fine dining',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'classic',
    logoColors: 'Deep red, gold, black',
  },

  ecommerce_store: {
    id: 'ecommerce_store',
    name: 'E-commerce Store',
    icon: '🛍️',
    category: 'Retail & E-commerce',
    brandDescription: 'An innovative online store offering carefully curated products that combine quality, value, and exceptional customer service for a seamless shopping experience.',
    industry: 'ecommerce_retail',
    imageStyleNotes: 'Clean product photography, white background product shots, lifestyle product usage, packaging and unboxing, multiple product angles, detail shots, shipping and delivery imagery, customer satisfaction moments, product collections, promotional graphics',
    targetKeywords: 'online store, e-commerce, online shopping, products, retail, shop online, free shipping, quality products, customer service',
    logoType: 'logotype',
    logoShape: 'square',
    logoStyle: 'modern',
    logoColors: 'Vibrant blue, orange, white',
  },

  podcast_host: {
    id: 'podcast_host',
    name: 'Podcast Host',
    icon: '🎙️',
    category: 'Content & Media',
    brandDescription: 'An engaging podcast host creating compelling audio content that informs, entertains, and inspires listeners through authentic conversations and expert storytelling.',
    industry: 'arts_entertainment',
    imageStyleNotes: 'Podcast studio setup, microphone and recording equipment, headphones, soundwave graphics, episode cover art, host portraits, guest interview moments, audio visualization, branded backgrounds, promotional graphics, behind-the-scenes recording, listening experience imagery',
    targetKeywords: 'podcast, podcast host, audio content, podcast episodes, interviews, storytelling, podcast show, listen now, podcast network',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'bold',
    logoColors: 'Purple, electric teal, black',
  },
};

// Helper to get templates by category
export function getTemplatesByCategory(category: BrandTemplate['category']): BrandTemplate[] {
  return Object.values(brandTemplates).filter(template => template.category === category);
}

// Helper to get all categories
export function getAllCategories(): BrandTemplate['category'][] {
  return Array.from(new Set(Object.values(brandTemplates).map(t => t.category)));
}

// Helper to get template by ID
export function getTemplateById(id: string): BrandTemplate | undefined {
  return brandTemplates[id];
}
