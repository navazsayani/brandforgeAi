# AI Flows Testing Coverage Gap

## Summary
**Total AI Flows**: 16
**Currently Tested**: 2 (12.5%)
**Missing Tests**: 14 (87.5%)

## ✅ Currently Tested

### 1. `generate-images.ts` ✓
**Test File**: `__tests__/unit/ai/flows/generate-images.test.ts`

**What's Tested**:
- Input validation (required fields)
- Style preset handling
- RAG context integration
- Model selection logic
- Error handling
- Output format validation

**Test Data Examples**:
```typescript
// Test Case 1: Basic generation
{
  brandDescription: 'A modern tech company',
  imageStyle: 'photorealistic',
  numberOfImages: 1,
  aspectRatio: '1:1'
}

// Test Case 2: With example images
{
  brandDescription: 'Organic skincare brand',
  imageStyle: 'natural',
  exampleImageUrls: ['https://example.com/ref1.jpg'],
  customStyleNotes: 'Soft lighting, earth tones'
}

// Test Case 3: Error handling
{
  brandDescription: '',  // Empty - should fail
  numberOfImages: 10     // Too many - should limit
}
```

### 2. `fireworks-generation.ts` ✓
**Test File**: `__tests__/unit/ai/flows/fireworks-generation.test.ts`

**What's Tested**:
- Dimension calculations for aspect ratios
- Model-specific parameters (SDXL Turbo vs SDXL 3)
- Image-to-image (img2img) generation
- ControlNet integration
- API key validation
- Error handling (400, 404, 500 responses)
- Empty response handling

**Test Data Examples**:
```typescript
// Test Case 1: SDXL Turbo generation
{
  model: 'sdxl-turbo',
  prompt: 'A beautiful landscape',
  width: 1024,
  height: 1024,
  num_images: 1
}

// Test Case 2: Img2img editing
{
  model: 'stable-diffusion-xl-1024-v1-0',
  prompt: 'Make the sky more dramatic',
  image: 'base64inputimage',
  strength: 0.7
}

// Test Case 3: ControlNet
{
  model: 'stable-diffusion-xl-1024-v1-0',
  prompt: 'A person in the same pose',
  controlnet: {
    type: 'openpose',
    conditioning_scale: 1.0,
    control_image: 'base64controlimage'
  }
}
```

---

## ❌ Missing Test Coverage (14 Flows)

### **Critical Flows (High Priority)**

#### 1. `generate-social-media-caption.ts` ❌
**Why Critical**: Used in Content Studio social tab

**Should Test**:
```typescript
// Test Data Example:
{
  brandDescription: 'Modern tech startup',
  tone: 'professional',
  platform: 'instagram',
  postGoal: 'promotion',
  imageDescription: 'Product launch photo',
  targetAudience: 'tech enthusiasts'
}

// What to Test:
✓ Different tones (professional, casual, funny, inspirational)
✓ Different platforms (Instagram, LinkedIn, Twitter, Facebook)
✓ Post goals (promotion, engagement, education, storytelling)
✓ With/without image context
✓ Character limits per platform
✓ Hashtag generation
✓ Call-to-action generation
✓ Error: empty brand description
```

#### 2. `generate-blog-content.ts` ❌
**Why Critical**: Used in Content Studio blog tab

**Should Test**:
```typescript
// Test Data Example:
{
  brandName: 'TechCorp',
  blogBrandDescription: 'AI solutions company',
  blogKeywords: 'artificial intelligence, automation, efficiency',
  blogOutline: '1. Introduction\n2. Benefits\n3. Case Studies\n4. Conclusion',
  blogTone: 'informative',
  targetPlatform: 'Medium',
  articleStyle: 'How-To Guide',
  targetAudience: 'Business owners'
}

// What to Test:
✓ Different blog tones (informative, persuasive, storytelling)
✓ Different article styles (How-To, Listicle, Case Study)
✓ Outline structure parsing
✓ SEO optimization (keywords integration)
✓ Platform-specific formatting (Medium vs WordPress)
✓ Word count targets
✓ Tag/category generation
✓ Error: missing outline
```

#### 3. `generate-ad-campaign.ts` ❌
**Why Critical**: Used in Campaign Manager

**Should Test**:
```typescript
// Test Data Example:
{
  brandName: 'EcoShop',
  brandDescription: 'Sustainable products marketplace',
  campaignGoal: 'lead_generation',
  targetAudience: 'Environmentally conscious millennials',
  budget: '$5000',
  duration: '30 days',
  platform: 'google_ads'
}

// What to Test:
✓ Different campaign goals (awareness, leads, sales, traffic)
✓ Different platforms (Google Ads, Facebook Ads, LinkedIn)
✓ Budget allocation strategies
✓ Ad copy variations (headlines, descriptions, CTAs)
✓ Targeting recommendations
✓ A/B testing suggestions
✓ Error: invalid budget format
```

#### 4. `enhance-brand-description-flow.ts` ❌
**Why Critical**: Used in Brand Profile onboarding

**Should Test**:
```typescript
// Test Data Example:
{
  userInput: 'We sell organic coffee',
  industry: 'Food & Beverage',
  targetAudience: 'Health-conscious professionals',
  brandValues: 'Sustainability, Quality, Fair Trade'
}

// What to Test:
✓ Short input → Detailed description
✓ Generic input → Unique positioning
✓ Multiple industries
✓ Preserves user's core message
✓ Adds missing elements (tone, differentiation)
✓ Length constraints (min/max)
✓ Error: very short input (< 5 words)
```

#### 5. `generate-brand-logo-flow.ts` ❌
**Why Critical**: Used in Brand Profile setup

**Should Test**:
```typescript
// Test Data Example:
{
  brandName: 'TechNova',
  brandDescription: 'Next-gen cloud solutions',
  industry: 'Technology',
  colorPreferences: ['blue', 'silver'],
  stylePreferences: 'modern, minimalist'
}

// What to Test:
✓ Different design styles (modern, vintage, playful, elegant)
✓ Color palette generation
✓ Typography recommendations
✓ Icon/symbol suggestions
✓ Multiple variations
✓ Vector format support
✓ Error: brand name too long (> 20 chars)
```

### **Supporting Flows (Medium Priority)**

#### 6. `describe-image-flow.ts` ❌
**Used for**: Reference image analysis

**Should Test**:
```typescript
// Test Data:
{
  imageUrl: 'https://example.com/product.jpg',
  purpose: 'product_reference'  // or 'style_reference', 'composition'
}

// Test Cases:
✓ Product images → Detailed product description
✓ Style reference → Color palette, mood, composition
✓ Multiple objects detection
✓ Error: invalid image URL
✓ Error: image too large
```

#### 7. `generate-blog-outline-flow.ts` ❌
**Used for**: Blog planning

**Should Test**:
```typescript
// Test Data:
{
  topic: 'How to Choose Cloud Storage',
  targetAudience: 'Small business owners',
  desiredLength: '1500 words',
  tone: 'helpful'
}

// Test Cases:
✓ Different article lengths (500, 1500, 3000 words)
✓ Different structures (How-To, Listicle, Comparison)
✓ Logical section flow
✓ Intro, body, conclusion structure
✓ Estimated time per section
```

#### 8. `extract-brand-info-from-url-flow.ts` ❌
**Used for**: Quick brand setup from website

**Should Test**:
```typescript
// Test Data:
{
  websiteUrl: 'https://example-brand.com'
}

// Test Cases:
✓ Extract brand name
✓ Extract tagline/description
✓ Identify industry
✓ Extract color scheme
✓ Parse about page
✓ Error: URL not accessible
✓ Error: non-business website
```

#### 9. `edit-image-flow.ts` ❌
**Used for**: Image refinement/editing

**Should Test**:
```typescript
// Test Data:
{
  originalImageUrl: 'https://example.com/image.jpg',
  editInstructions: 'Make the background darker',
  style: 'photorealistic',
  strength: 0.7  // How much to change
}

// Test Cases:
✓ Color adjustments
✓ Background changes
✓ Object removal/addition
✓ Style transfers
✓ Strength parameter (0.1 to 1.0)
✓ Error: incompatible edit instructions
```

#### 10. `enhance-refine-prompt-flow.ts` ❌
**Used for**: Improving user prompts

**Should Test**:
```typescript
// Test Data:
{
  userPrompt: 'nice picture of product',
  context: 'product_photography',
  brandStyle: 'modern, professional'
}

// Test Cases:
✓ Vague prompt → Detailed prompt
✓ Adding technical details
✓ Incorporating brand style
✓ Context-aware enhancements
✓ Negative prompt generation
✓ Different contexts (social, blog, ad)
```

### **Auto-Fill Flows (Lower Priority)**

#### 11. `populate-image-form-flow.ts` ❌
**Used for**: Template auto-fill

**Should Test**:
```typescript
// Test Data:
{
  templateId: 'product_photo',
  brandData: { /* full brand profile */ },
  userIntent: 'Create product shot for Instagram'
}

// Test Cases:
✓ Different templates pre-fill correctly
✓ Brand data properly merged
✓ User intent affects suggestions
✓ Default values when data missing
```

#### 12. `populate-social-form-flow.ts` ❌
**Should Test**:
- Auto-fill social media post forms
- Platform-specific defaults
- Audience targeting suggestions

#### 13. `populate-blog-form-flow.ts` ❌
**Should Test**:
- Auto-fill blog post forms
- SEO keyword suggestions
- Target audience defaults

#### 14. `populate-ad-campaign-form-flow.ts` ❌
**Should Test**:
- Auto-fill ad campaign forms
- Budget recommendations
- Platform-specific settings

---

## Impact of Missing Tests

### 🚨 **Risks Without AI Flow Tests**

1. **Silent Failures**: AI generates bad output, but no test catches it
2. **Breaking Changes**: Code changes might break prompts without detection
3. **Prompt Drift**: Prompts change over time, quality degrades unnoticed
4. **Cost Issues**: Inefficient prompts waste API tokens
5. **User Experience**: Poor AI outputs frustrate users

### 💡 **What You're Missing**

```typescript
// Without tests, these issues go undetected:

// Example 1: Social caption too long for platform
const caption = generateSocialMediaCaption(input)
// ❌ No test checks if caption fits Twitter's 280 chars
// Result: Users manually have to trim

// Example 2: Blog outline doesn't match structure
const outline = generateBlogOutline(input)
// ❌ No test validates H1, H2, H3 hierarchy
// Result: Poorly structured blog posts

// Example 3: Ad campaign ignores budget
const campaign = generateAdCampaign({ budget: '$100' })
// ❌ No test verifies budget-appropriate recommendations
// Result: Suggests strategies that cost $10,000

// Example 4: Brand info extraction fails silently
const brandInfo = await extractBrandInfoFromUrl('https://broken.com')
// ❌ No test handles 404 or malformed HTML
// Result: App crashes or hangs
```

---

## Recommended Testing Approach for AI Flows

### **Level 1: Unit Tests (Mock AI)**
```typescript
// Test prompt construction without calling real AI
test('should build correct prompt for social post', () => {
  const prompt = buildSocialPrompt({
    brandDescription: 'Eco-friendly products',
    tone: 'friendly',
    platform: 'instagram'
  })

  expect(prompt).toContain('Eco-friendly products')
  expect(prompt).toContain('Instagram')
  expect(prompt).toContain('friendly tone')
})
```

### **Level 2: Integration Tests (Mock AI Response)**
```typescript
// Test flow logic with mocked AI output
test('should parse AI response correctly', async () => {
  mockAI.generate.mockResolvedValue({
    caption: 'Great product! 🌿 #eco #sustainable',
    hashtags: ['eco', 'sustainable']
  })

  const result = await generateSocialMediaCaption(input)

  expect(result.caption).toHaveLength(lessThan(280)) // Twitter limit
  expect(result.hashtags).toHaveLength(greaterThan(0))
})
```

### **Level 3: E2E Tests (Real AI - Optional)**
```typescript
// Test with real AI (expensive, slow, but valuable)
test('real AI generates valid social post', async () => {
  const result = await generateSocialMediaCaption({
    brandDescription: 'Modern coffee shop',
    tone: 'friendly',
    platform: 'instagram'
  })

  expect(result.caption).toMatch(/coffee|café/i)
  expect(result.hashtags).toContain('coffee')
}, 30000) // 30 second timeout for real AI
```

---

## Priority Recommendations

### **Immediate (Critical Flows)**
1. ✅ `generate-social-media-caption.ts` - Most used
2. ✅ `generate-blog-content.ts` - Core feature
3. ✅ `generate-ad-campaign.ts` - Revenue-critical
4. ✅ `enhance-brand-description-flow.ts` - Onboarding UX

### **Soon (Supporting Flows)**
5. ✅ `generate-brand-logo-flow.ts` - Brand setup
6. ✅ `describe-image-flow.ts` - Image analysis
7. ✅ `edit-image-flow.ts` - Image refinement
8. ✅ `extract-brand-info-from-url-flow.ts` - Quick setup

### **Later (Auto-Fill Flows)**
9-14. All populate-*-form flows - Nice to have

---

## Estimated Effort

**Per AI Flow Test File**: ~2-4 hours
**Total for All 14 Flows**: ~28-56 hours (3-7 days)

**Quick Win Strategy**: Test top 4 critical flows first (~8-16 hours)

---

## Would You Like Me To...?

1. ✅ **Create tests for the top 4 critical AI flows?**
2. ✅ **Create a template for AI flow testing?**
3. ✅ **Show examples of mocking AI responses?**
4. ✅ **Create integration tests with real AI calls?**

Let me know which AI flows are most important to your app, and I can create comprehensive tests for them!
