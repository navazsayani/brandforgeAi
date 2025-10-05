# BrandForge AI - Comprehensive Application Analysis

**Last Updated:** 2025-10-05
**Analyzed by:** Claude Code
**Purpose:** Complete technical documentation of the BrandForge AI application based on actual codebase analysis

---

## Executive Summary

**BrandForge AI** is a comprehensive AI-powered brand building and marketing SaaS platform built with Next.js 15, React 19, Firebase, and multiple AI providers (Google Gemini, Freepik Imagen3, Fireworks AI). The platform enables users to create complete brand identities including logos, images, social media content, blog posts, and advertising campaigns using AI that learns from user feedback through a sophisticated Retrieval-Augmented Generation (RAG) system.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Core Features](#core-features)
4. [Authentication & User Management](#authentication--user-management)
5. [Data Models](#data-models)
6. [AI Integration](#ai-integration)
7. [RAG System](#rag-system)
8. [Subscription & Pricing](#subscription--pricing)
9. [File Structure](#file-structure)
10. [Key Workflows](#key-workflows)
11. [API Routes](#api-routes)
12. [Deployment](#deployment)

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15.1.0 (App Router)
- **React:** 19.0.0
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4.1
- **Fonts:** Sora (primary), JetBrains Mono (monospace)
- **State Management:** React Context API (AuthContext, BrandContext, ThemeContext)
- **Data Fetching:** TanStack Query (React Query) 5.28.0
- **Form Handling:** React Hook Form 7.54.2 + Zod 3.24.2
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React 0.475.0

### Backend & AI
- **AI Framework:** Genkit 1.7.0 (@genkit-ai/googleai, @genkit-ai/next)
- **AI Providers:**
  - Google Gemini (via @google/genai 1.9.0)
  - Freepik Imagen3 (via Freepik API)
  - Fireworks AI (optional, via REST API)
  - OpenAI (for RAG embeddings)
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Authentication:** Firebase Auth (Email/Password, Google OAuth)
- **Payments:** Razorpay 2.9.4 (for Indian market)

### Infrastructure
- **Hosting:** Firebase Hosting with Next.js
- **Functions:** Firebase Cloud Functions
- **Build Tool:** Next.js Turbopack (dev mode)
- **Testing:** Jest, Playwright
- **Deployment:** Firebase CLI

---

## Architecture Overview

### Application Structure

BrandForge AI uses Next.js 15 App Router with the following route structure:

```
src/app/
├── (authenticated)/          # Protected routes requiring authentication
│   ├── dashboard/           # Main user dashboard
│   ├── brand-profile/       # Brand profile setup & management
│   ├── content-studio/      # AI content generation hub
│   ├── image-library/       # Saved images library
│   ├── campaign-manager/    # Ad campaign management
│   ├── deployment-hub/      # Content deployment center
│   ├── settings/            # User settings
│   ├── pricing/             # Pricing page (authenticated)
│   ├── quick-start/         # Quick start guide
│   └── admin/              # Admin-only routes
│       ├── dashboard/       # Admin overview
│       ├── usage/          # User usage monitoring
│       ├── rag/            # RAG system settings
│       └── cleanup/        # Data cleanup tools
├── (legal)/                 # Legal pages
│   ├── privacy-policy/
│   └── terms-of-service/
├── page.tsx                # Public landing page
├── login/                  # Login page
├── signup/                 # Registration page
├── plans/                  # Public pricing page
├── features/               # Features showcase
├── blog/                   # Blog listing & posts
├── templates/              # Industry templates showcase
├── vs/                     # Competitor comparison pages
│   ├── chatgpt/
│   ├── canva/
│   ├── jasper/
│   └── [others]/
└── api/                    # API routes
    ├── admin/              # Admin API endpoints
    ├── oauth/              # OAuth callbacks
    └── rag/                # RAG vectorization endpoints
```

### Design Patterns

1. **Context-Based State Management**
   - `AuthContext`: User authentication state
   - `BrandContext`: Brand profile data and generated content
   - `ThemeContext`: Dark/light mode theming

2. **Server Actions Pattern**
   - All AI generation flows use Next.js Server Actions
   - Defined in `src/lib/actions.ts`
   - Type-safe with FormState generic type

3. **Component Architecture**
   - Atomic design with shadcn/ui components
   - Client components marked with `"use client"`
   - Server components by default

4. **Data Flow**
   - Firebase Firestore for persistent storage
   - React Query for server state caching
   - Context API for global client state
   - Server Actions for mutations

---

## Core Features

### 1. Brand Profile Creation

**Location:** [src/app/(authenticated)/brand-profile/page.tsx](src/app/(authenticated)/brand-profile/page.tsx)

Users can create and manage their brand identity with:
- **Basic Information:** Brand name, website URL, description
- **Industry Selection:** 14+ industry categories
- **Brand Logo Generation:** AI-powered logo creation with customization
  - Logo types: logomark, logotype, monogram
  - Shapes: circle, square, shield, hexagon, diamond, custom
  - Styles: minimalist, modern, classic, playful, bold, elegant
  - Color preferences
  - Background options
- **Example Images:** Upload up to 2 (free) or 5 (premium) brand images
- **Image Style Notes:** Custom styling preferences
- **Target Keywords:** SEO and content optimization keywords
- **URL Extraction:** AI extracts brand info from website URL
- **Template System:** 20+ pre-configured industry templates

**Brand Templates Include:**
- Content Creator, Online Course Creator, Social Media Manager
- Freelance Designer, Web Developer, Virtual Assistant
- Coffee Shop, Restaurant, Food Delivery
- Personal Trainer, Yoga Instructor, Nutritionist
- Fashion Boutique, Handmade Crafts, Dropshipping
- And many more...

### 2. Content Studio (AI Generation Hub)

**Location:** [src/app/(authenticated)/content-studio/page.tsx](src/app/(authenticated)/content-studio/page.tsx)

Centralized hub for all AI content generation with three main tabs:

#### A. Image Generation
- **Providers:** Gemini (free), Freepik Imagen3 (premium), Fireworks AI (optional)
- **Inputs:**
  - Brand description
  - Industry context
  - Image style (50+ presets: photorealistic, cinematic, minimalist, watercolor, etc.)
  - Example image upload
  - Aspect ratio selection (1:1, 4:5, 16:9, 9:16, 3:2, 2:3)
  - Negative prompts
  - Seed values for reproducibility
- **Freepik-Specific Controls:**
  - Effect colors (19 options: B&W, pastel, sepia, vibrant, etc.)
  - Lighting (12 options: studio, cinematic, golden hour, etc.)
  - Framing (11 options: portrait, macro, aerial view, etc.)
  - Dominant color selection (up to 5 custom colors)
- **Advanced Features:**
  - Multiple image generation (premium)
  - AI Refinement Studio (iterative editing with text prompts)
  - Version history
  - Save to library
  - Download capabilities

#### B. Social Media Post Generation
- **Platforms:** Instagram, LinkedIn, Twitter/X, Facebook, YouTube, TikTok, Multi-platform
- **Inputs:**
  - Post idea/topic
  - Target platform
  - Language (14 languages supported)
  - Post goal (brand awareness, engagement, promotion, etc.)
  - Tone (professional, friendly, witty, inspirational, urgent)
  - Target audience
  - Call-to-action
  - Image attachment options (generated, profile, library, none)
- **Outputs:**
  - Platform-optimized caption
  - Hashtags
  - Platform-specific preview (Instagram, LinkedIn, Twitter)
- **Smart Features:**
  - AI form pre-fill
  - Platform-specific character limits
  - Cultural language nuances

#### C. Blog Post Generation
- **Two-Step Process:**
  1. Generate outline (free tier)
  2. Generate full content (premium tier)
- **Inputs:**
  - Topic/title
  - Target keywords
  - Article style (how-to, listicle, case study, opinion, news, comparison, FAQ)
  - Tone (informative, conversational, professional, witty, inspirational, technical, storytelling)
  - Target audience
  - Platform (Medium, Other)
- **Outputs:**
  - SEO-optimized title
  - Structured outline
  - Full article content (premium)
  - Relevant tags
- **Features:**
  - Markdown support
  - AI form pre-fill
  - Copy to clipboard

### 3. Image Library

**Location:** [src/app/(authenticated)/image-library/page.tsx](src/app/(authenticated)/image-library/page.tsx)

- View all saved images from content studio
- Organized by creation date
- Download functionality
- Deletion capabilities
- Pagination support

### 4. AI Refinement Studio

**Location:** [src/components/RefineImageDialog.tsx](src/components/RefineImageDialog.tsx)

Unique feature that allows iterative image editing:
- **Simple Text Commands:** "Make the sky more dramatic", "Add morning mist"
- **Multiple Providers:** Freepik, Fireworks, Gemini
- **Quality Modes:** Fast preview to premium quality
- **Version History:** Revert to any previous version
- **Prompt Enhancement:** AI improves user prompts
- **Unlimited Refinements:** No restart needed

### 5. Campaign Manager

Ad campaign generation with:
- Google Ads and Meta Ads targeting
- Multiple headline variations
- Body text options
- Platform-specific guidance
- Budget and goal-based optimization

### 6. Deployment Hub

Centralized view of all generated content ready for publishing.

### 7. Dashboard

**Location:** [src/app/(authenticated)/dashboard/page.tsx](src/app/(authenticated)/dashboard/page.tsx)

Personalized overview with:
- Quick access to all features
- Recent content
- Usage statistics
- Onboarding checklist for new users
- Welcome gift dialog

---

## Authentication & User Management

### Firebase Authentication

**Context:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

**Supported Methods:**
1. Email/Password
2. Google OAuth (via popup)

**Auth Flow:**
- User registers/logs in
- Firebase Auth creates user
- BrandContext automatically creates/loads brand profile
- Redirect to dashboard or previous protected route

**Protected Routes:**
- All routes under `(authenticated)` group require authentication
- Middleware redirects unauthenticated users to login
- Admin routes require `admin@brandforge.ai` email

**Admin Features:**
- Special admin user: `admin@brandforge.ai`
- Admin can view/edit any user's brand profile
- Access to usage monitoring
- RAG system configuration
- Data cleanup tools

---

## Data Models

### Core Types (src/types/index.ts)

#### BrandData
```typescript
interface BrandData {
  brandName?: string;
  websiteUrl?: string;
  brandDescription?: string;
  industry?: string;
  imageStyleNotes?: string;
  targetKeywords?: string;
  exampleImages?: string[];        // Firebase Storage URLs
  brandLogoUrl?: string;            // Firebase Storage URL
  logoType?: 'logomark' | 'logotype' | 'monogram';
  logoShape?: 'circle' | 'square' | 'shield' | 'hexagon' | 'diamond' | 'custom';
  logoStyle?: 'minimalist' | 'modern' | 'classic' | 'playful' | 'bold' | 'elegant';
  logoColors?: string;
  logoBackground?: 'white' | 'transparent' | 'dark';
  plan?: 'free' | 'premium';
  userEmail?: string;
  subscriptionEndDate?: any;         // Firestore Timestamp
  welcomeGiftOffered?: boolean;
  hasUsedPreviewMode?: boolean;
}
```

#### GeneratedImage
```typescript
interface GeneratedImage {
  id: string;
  src: string;                      // Data URI or Storage URL
  prompt: string;
  style: string;
  ragMetadata?: {
    wasRAGEnhanced: boolean;
    ragInsights: any[];
    contentId: string;
    userId: string;
  };
}
```

#### GeneratedSocialMediaPost
```typescript
interface GeneratedSocialMediaPost {
  id: string;
  platform: 'Instagram' | 'LinkedIn' | 'Twitter' | 'Facebook' | 'all';
  imageSrc: string | null;
  imageDescription: string;
  caption: string;
  hashtags: string;
  tone: string;
  postGoal?: string;
  targetAudience?: string;
  callToAction?: string;
  language?: string;
  createdAt?: any;
  status: 'draft' | 'scheduled' | 'deployed';
  ragMetadata?: { /* ... */ };
}
```

#### GeneratedBlogPost
```typescript
interface GeneratedBlogPost {
  id: string;
  title: string;
  content: string;
  tags: string;
  platform: 'Medium' | 'Other';
  articleStyle?: string;
  targetAudience?: string;
  blogTone?: string;
  createdAt?: any;
  status: 'draft' | 'scheduled' | 'deployed';
  outline?: string;
  ragMetadata?: { /* ... */ };
}
```

### Firestore Structure

```
/users/{userId}
  /brandProfiles/{userId}           # User's brand profile
  /savedLibraryImages/              # Saved generated images
    /{imageId}
  /usage/                           # Monthly usage tracking
    /{YYYY-MM}
  /contentFeedback/                 # User feedback on generated content
  /ragVectors/                      # RAG embeddings for this user
  /ragMetrics/
    /performance                    # RAG performance metrics
  /adminSettings/                   # User-specific admin overrides

/configuration/
  /plans                            # Dynamic pricing configuration

/adminSettings/
  /ragSystemConfig                  # Global RAG settings
  /modelConfig                      # AI model configuration

/userIndex/
  /profiles                         # Central index of all users
```

---

## AI Integration

### Genkit Framework

**Configuration:** [src/ai/genkit.ts](src/ai/genkit.ts)

BrandForge uses Firebase Genkit for AI orchestration with multiple flows:

### AI Flows (src/ai/flows/)

1. **generate-images.ts** - Image generation with multi-provider support
2. **edit-image-flow.ts** - Image refinement/editing
3. **describe-image-flow.ts** - Image description generation
4. **generate-social-media-caption.ts** - Social media content
5. **generate-blog-content.ts** - Blog post generation
6. **generate-blog-outline-flow.ts** - Blog outline creation
7. **generate-ad-campaign.ts** - Ad campaign generation
8. **generate-brand-logo-flow.ts** - Logo creation
9. **enhance-brand-description-flow.ts** - Brand description enhancement
10. **extract-brand-info-from-url-flow.ts** - Website scraping
11. **populate-*-form-flow.ts** - AI-powered form pre-filling
12. **enhance-refine-prompt-flow.ts** - Prompt improvement

### AI Providers

#### Google Gemini
- **Default provider** for free tier
- Models: Gemini 1.5 Flash, Gemini 1.5 Pro
- Used for: Image generation, text generation, vision tasks
- Fast and cost-effective

#### Freepik Imagen3
- **Premium provider**
- Advanced styling controls
- Asynchronous task-based generation
- High-quality outputs
- Supports structural styles and effects

#### Fireworks AI (Optional)
- **Alternative provider**
- Models: SDXL Turbo, SDXL 3
- Fast generation times
- Optional advanced controls
- Configurable via admin settings

#### OpenAI
- **Embeddings only**
- Model: text-embedding-3-small
- Used exclusively for RAG system
- Generates vector embeddings for content

### Model Configuration

**Admin-configurable:** [src/lib/model-config.ts](src/lib/model-config.ts)

Stored in Firestore at `/adminSettings/modelConfig`:
- Image generation model selection
- Text-to-image model
- Fast model (for quick operations)
- Vision model (for image description)
- Powerful model (for complex tasks)
- Provider toggles (Freepik, Fireworks)
- Intelligent model selection
- Payment mode (live/test)

---

## RAG System

**Implementation:** [src/lib/rag-engine.ts](src/lib/rag-engine.ts)

BrandForge's Retrieval-Augmented Generation system is a sophisticated AI learning mechanism that improves content quality over time.

### How It Works

1. **Vectorization**: Content is converted to embeddings using OpenAI's text-embedding-3-small
2. **Storage**: Vectors stored in Firestore at `/users/{userId}/ragVectors/`
3. **Retrieval**: Similar past content retrieved based on cosine similarity
4. **Augmentation**: Retrieved context injected into AI prompts
5. **Feedback Loop**: User ratings update performance metrics

### What Gets Vectorized

- Brand profiles (on save)
- Generated images (with metadata)
- Social media posts
- Blog posts
- Ad campaigns
- Brand logos
- Saved library images

### Auto-Vectorization

**Service:** [src/lib/rag-auto-vectorizer.ts](src/lib/rag-auto-vectorizer.ts)

**Triggers:**
- Brand profile updates (threshold-based)
- Content generation with user feedback
- Image saves to library
- Logo generation

**Threshold Logic:**
- Only re-vectorizes if significant changes detected
- Compares old vs new content similarity
- Configurable similarity threshold

### RAG Context Structure

```typescript
interface RAGContext {
  brandPatterns: string;
  successfulStyles: string;
  avoidPatterns: string;
  industryInsights: string;
  seasonalTrends: string;
  voicePatterns?: string;
  effectiveHashtags?: string;
  seoKeywords?: string;
  performanceInsights?: string;
  platformPatterns?: string;
  languagePatterns?: string;
}
```

### Feedback Service

**Implementation:** [src/lib/feedback-service.ts](src/lib/feedback-service.ts)

Users can rate content with:
- Star ratings (1-5)
- Helpful/Not helpful buttons
- Optional comments

**Performance Tracking:**
- Separate metrics for RAG-enhanced vs non-RAG content
- Average ratings comparison
- Helpfulness rates
- Pattern statistics

### Admin Controls

**Location:** [src/app/(authenticated)/admin/rag/page.tsx](src/app/(authenticated)/admin/rag/page.tsx)

Admins can configure:
- Rate limiting (global and per-user)
- Vector cleanup policies
- Embedding model selection
- Cost monitoring
- Similarity thresholds
- Cache settings
- Manual vectorization triggers

---

## Subscription & Pricing

### Plans Configuration

**Location:** [src/lib/plans-config.ts](src/lib/plans-config.ts)

**Storage:** Firestore `/configuration/plans` with fallback to constants

### Plan Tiers

#### Free Plan
- **Price:** $0/month (₹0/month)
- **Quotas:**
  - 10 image generations/month
  - 5 social posts/month
  - 0 blog posts (outline only)
- **Features:**
  - 20+ industry templates
  - Brand profile setup
  - AI-powered idea generation
  - Blog outline generation
  - Basic AI models (Gemini)

#### Pro Plan
- **Price:** $12/month (₹399/month) - discounted from $29/₹999
- **Quotas:**
  - 100 image generations/month
  - 50 social posts/month
  - 5 full blog posts/month
- **Features:**
  - Everything in Free
  - Full blog post generation
  - Premium image models (Freepik)
  - Multiple images at once
  - Save images to library
  - Priority support

### Currency Localization

- Automatic detection via Cloudflare CDN (`/cdn-cgi/trace`)
- USD for US/global markets
- INR for Indian market
- Different pricing strategies per region

### Payment Integration

**Razorpay** (Indian market):
- Test and live modes
- Configurable via admin settings
- Payment mode: `test` or `live`

### Usage Tracking

**Location:** `/users/{userId}/usage/{YYYY-MM}`

Monthly quotas tracked per content type:
- `imageGenerations`
- `socialPosts`
- `blogPosts`

**Reset:** Automatically on the 1st of each month

**Enforcement:**
- Pre-generation quota checks
- Transaction-based increments
- Admin users exempt from quotas

---

## File Structure

```
/home/user/studio/
├── public/                          # Static assets
│   ├── videos/                      # Feature demo videos
│   ├── brandforge-*.png             # Logo variations
│   └── hero-*.svg                   # Landing page illustrations
├── src/
│   ├── ai/                          # Genkit AI flows
│   │   ├── genkit.ts               # Genkit configuration
│   │   ├── dev.ts                  # Development server
│   │   ├── flows/                  # Individual AI flows
│   │   └── tools/                  # AI tools (web scraping, etc.)
│   ├── app/                        # Next.js App Router
│   │   ├── (authenticated)/        # Protected routes
│   │   ├── (legal)/               # Legal pages
│   │   ├── api/                   # API routes
│   │   ├── blog/                  # Blog pages
│   │   ├── vs/                    # Comparison pages
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   ├── globals.css            # Global styles
│   │   └── [other pages]/
│   ├── components/                 # React components
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── feedback/              # Feedback system components
│   │   ├── admin/                 # Admin-specific components
│   │   ├── AppShell.tsx           # Main app layout
│   │   ├── PublicHeader.tsx       # Public page header
│   │   ├── RefineImageDialog.tsx  # Image refinement modal
│   │   ├── SocialMediaPreviews.tsx # Platform previews
│   │   └── [other components]/
│   ├── contexts/                   # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── BrandContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries
│   │   ├── actions.ts             # Server actions
│   │   ├── constants.ts           # App constants
│   │   ├── firebase.ts            # Firebase config (client)
│   │   ├── firebase-admin.ts      # Firebase Admin SDK
│   │   ├── firebaseConfig.ts      # Firebase client setup
│   │   ├── rag-engine.ts          # RAG system core
│   │   ├── rag-auto-vectorizer.ts # Auto vectorization
│   │   ├── feedback-service.ts    # Feedback handling
│   │   ├── model-config.ts        # AI model config
│   │   ├── plans-config.ts        # Pricing config
│   │   ├── templates.ts           # Brand templates
│   │   ├── utils.ts               # Utilities
│   │   └── [other libs]/
│   └── types/                      # TypeScript types
│       ├── index.ts               # Core types
│       └── feedback.ts            # Feedback types
├── functions/                      # Firebase Functions
├── firestore.rules                # Firestore security rules
├── firebase.json                  # Firebase configuration
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── [docs & config files]
```

---

## Key Workflows

### 1. New User Onboarding

```
1. User lands on landing page (/)
2. Clicks "Get Started" → Redirects to /signup
3. User registers (email or Google)
4. BrandContext automatically creates empty brand profile
5. Redirect to /dashboard
6. Onboarding checklist appears:
   - Complete brand profile
   - Generate first image
   - Create social post
   - Explore templates
7. User can use "Preview Mode" to test features before completing profile
8. Welcome gift dialog offers bonus credits (one-time)
```

### 2. Image Generation Flow

```
1. User navigates to /content-studio
2. Selects "Image" tab
3. Options:
   a. Manual form fill
   b. Click "AI Fill" → Auto-populate from brand profile
4. Configures:
   - Style, aspect ratio, provider
   - Optional: example image, custom prompt
   - Premium: Freepik effects, multiple images
5. Clicks "Generate Images"
6. Server action:
   - Checks quota
   - Increments usage
   - Calls AI flow
   - Returns image URLs or task IDs
7. For Freepik: Polls task status
8. Images displayed in grid
9. User can:
   - Refine with AI Refinement Studio
   - Download
   - Save to library (premium)
10. Background: RAG vectorization if user provides feedback
```

### 3. AI Refinement Workflow

```
1. User clicks "Refine" on generated image
2. RefineImageDialog opens with original image
3. User types simple instruction: "Make sky more dramatic"
4. Optional: Click "Enhance Prompt" for AI improvement
5. Select quality mode (fast/balanced/premium)
6. Click "Apply Refinement"
7. Server action:
   - Calls edit-image-flow with enhanced prompt
   - Returns new image URL
8. New version appears in dialog
9. Version history maintained
10. User can:
    - Accept → Replace original
    - Revert to any previous version
    - Continue refining
```

### 4. RAG Enhancement Flow

```
1. User generates content (any type)
2. Server action retrieves RAG context:
   - Queries user's vector store
   - Finds similar successful content
   - Extracts patterns and insights
3. RAG context injected into AI prompt:
   - Brand voice patterns
   - Successful styles
   - Effective keywords
   - Platform-specific patterns
4. AI generates enhanced content
5. Content returned with ragMetadata flag
6. UI shows RAG badge
7. User provides feedback (rating/helpful)
8. Feedback stored in /contentFeedback
9. Performance metrics updated
10. Future content gets smarter
```

---

## API Routes

### Admin API (`/api/admin/*`)

- **`/api/admin/users`** - List all users (admin only)
- **`/api/admin/rag-settings`** - Get/update RAG configuration
- **`/api/admin/rag-costs`** - View RAG cost analytics
- **`/api/admin/rag-vectorization`** - Manual vectorization triggers
- **`/api/admin/cleanup-user`** - Delete user data
- **`/api/admin/test-rag-config`** - Test RAG settings

### RAG API (`/api/rag/*`)

- **`/api/rag/vectorize-brand-profile`** - Vectorize brand profile (server-side)

### OAuth API

- **`/api/oauth/callback`** - OAuth redirect handler (Meta, X/Twitter)

---

## Deployment

### Firebase Hosting

**Configuration:** `firebase.json`

```json
{
  "hosting": [{
    "target": "brandforge-ai-app",
    "source": ".",
    "frameworksBackend": {
      "region": "us-west1"
    }
  }]
}
```

### Build & Deploy

```bash
# Development
npm run dev          # Port 9002, Turbopack enabled

# Build
npm run build        # Next.js production build

# Deploy
firebase deploy      # Full deployment
firebase deploy --only hosting    # Hosting only
firebase deploy --only functions  # Functions only
```

### Environment Variables

Required in `.env.local`:

```bash
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase (Admin - Server)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# AI Providers
GOOGLE_GENAI_API_KEY=          # Gemini
FREEPIK_API_KEY=               # Freepik Imagen3
FIREWORKS_API_KEY=             # Fireworks (optional)
OPENAI_API_KEY=                # For RAG embeddings

# Payment
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# RAG
NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS=false  # Local or cloud

# Image Generation
IMAGE_GENERATION_PROVIDER=GEMINI  # Default provider
```

### Hosting

- **Platform:** Firebase Hosting
- **Framework:** Next.js (Server-Side Rendering)
- **Region:** us-west1
- **CDN:** Firebase global CDN
- **Domain:** brandforge.me

---

## Key Technical Decisions

### 1. Why Next.js App Router?

- **Server Components:** Reduce client JS bundle
- **Server Actions:** Type-safe mutations without API routes
- **Streaming:** Progressive content loading
- **Route Groups:** Clean organization of authenticated vs public routes

### 2. Why Firebase?

- **Firestore:** Real-time NoSQL database, offline support
- **Storage:** Scalable file hosting with CDN
- **Auth:** Multiple providers, secure sessions
- **Hosting:** Integrated deployment with SSR support
- **Functions:** Serverless backend for scheduled tasks

### 3. Why Multiple AI Providers?

- **Gemini:** Free tier, fast, good quality
- **Freepik:** Premium quality, advanced controls
- **Fireworks:** Alternative for performance testing
- **OpenAI:** Best embeddings for RAG system

### 4. Why RAG System?

- **Personalization:** Each user's AI learns their brand voice
- **Quality Improvement:** Feedback loop ensures better results
- **Differentiation:** Unique feature vs competitors (ChatGPT, Canva)
- **Context Awareness:** AI remembers what works

### 5. Why Razorpay?

- **Indian Market Focus:** Localized payment solution
- **Lower Fees:** Better economics for INR transactions
- **UPI Support:** Preferred payment method in India

---

## Notable Features

### 1. Template System

20+ industry-specific templates provide instant brand profile setup:
- Content Creator, Online Course Creator, Social Media Manager
- Freelance Designer, Web Developer, Virtual Assistant
- Coffee Shop, Restaurant, Food Delivery
- Personal Trainer, Yoga Instructor
- Fashion Boutique, Handmade Crafts
- Real Estate Agent, Photographer
- Consulting, Coaching, Event Planning

Each template includes:
- Pre-written brand description
- Industry selection
- Image style notes
- Target keywords
- Logo preferences

### 2. Multi-Language Support

14 languages with cultural nuances:
- English, Spanish, French, German, Italian, Portuguese
- Hindi (Devanagari), Hindi (Roman), Hinglish
- Japanese, Korean, Chinese (Simplified)
- Arabic, Russian

Platform-specific cultural adaptations:
- Language configurations in `src/lib/constants.ts`
- Platform configurations per language
- Hashtag strategies per culture
- Tone adjustments

### 3. Platform Previews

Live social media previews in content studio:
- **Instagram:** Post layout with caption
- **LinkedIn:** Professional card layout
- **Twitter/X:** Tweet card with character count

### 4. Image Refinement Studio

Unique iterative editing:
- Text-based edits ("make sky darker")
- No need to regenerate from scratch
- Version history tracking
- Multiple quality modes
- Prompt enhancement AI

### 5. Admin Dashboard

Comprehensive admin tools:
- View/edit any user's profile
- Monitor usage across all users
- RAG system configuration
- Cost analytics
- Data cleanup utilities
- Manual vectorization triggers

---

## Performance Optimizations

1. **Image Handling:**
   - Next.js Image component with automatic optimization
   - Firebase Storage CDN delivery
   - Lazy loading
   - Responsive sizes

2. **Code Splitting:**
   - Dynamic imports for heavy components
   - Route-based code splitting (automatic)
   - Component-level lazy loading

3. **Caching:**
   - React Query for server state
   - Firestore SDK client-side cache
   - RAG config cache (5-minute TTL)
   - Model config cache

4. **Database:**
   - Firestore indexes for common queries
   - Collection group queries for admin
   - Pagination for large datasets
   - Transaction-based usage updates

5. **AI Optimization:**
   - Streaming responses where possible
   - Model selection based on task complexity
   - Batch operations for multiple images
   - Freepik async tasks for non-blocking generation

---

## Security Considerations

### Firestore Rules

- User-specific data isolation
- Admin-only access to sensitive collections
- Authenticated read/write requirements
- Field-level validation

### Authentication

- Secure session management via Firebase Auth
- Protected routes with middleware
- Admin email verification
- OAuth flow security

### API Security

- Server Actions with automatic CSRF protection
- Firebase Admin SDK for privileged operations
- Rate limiting on RAG vectorization
- Input validation with Zod schemas

### Data Privacy

- User data isolation per account
- Deletion capabilities (admin cleanup tools)
- No cross-user data access
- Secure storage URLs with expiration

---

## Known Limitations

1. **Freepik Task IDs:** Async generation requires polling
2. **Quota Enforcement:** Monthly limits enforced at generation time
3. **RAG Costs:** OpenAI embeddings incur costs (monitored by admin)
4. **Image Storage:** Firebase Storage limits apply
5. **Free Tier Restrictions:** Single image generation, basic models only

---

## Future Roadmap (Based on Code Comments)

1. **Social Media Deployment:** Direct posting to platforms (OAuth implemented)
2. **Campaign Analytics:** Track ad performance
3. **Advanced RAG:** A/B testing framework in place
4. **Scheduled Posts:** Status field exists (`draft`, `scheduled`, `deployed`)
5. **Multi-Currency:** Infrastructure for USD/INR, expandable
6. **Fireworks Integration:** Optional provider flags ready
7. **Advanced Image Controls:** Fireworks controls component exists

---

## Dependencies Overview

### Key Production Dependencies

- **Next.js:** 15.1.0 - Framework
- **React:** 19.0.0 - UI library
- **Firebase:** 11.8.1 - Backend services
- **Genkit:** 1.7.0 - AI orchestration
- **TanStack Query:** 5.28.0 - Data fetching
- **Radix UI:** Multiple packages - Accessible components
- **Tailwind CSS:** 3.4.1 - Styling
- **React Hook Form:** 7.54.2 - Form management
- **Zod:** 3.24.2 - Schema validation
- **OpenAI:** 4.20.0 - RAG embeddings
- **Razorpay:** 2.9.4 - Payments

### Dev Dependencies

- **TypeScript:** 5.x
- **Playwright:** 1.40.0 - E2E testing
- **Jest:** 29.7.0 - Unit testing
- **ESLint:** 8.57.0
- **Firebase CLI:** 1.2.0

---

## Conclusion

BrandForge AI is a sophisticated, full-stack AI SaaS application that combines:

✅ **Modern Frontend:** Next.js 15, React 19, TypeScript
✅ **Powerful AI:** Multi-provider integration with Gemini, Freepik, Fireworks
✅ **Smart Learning:** RAG system that improves with user feedback
✅ **Complete Branding:** Logo, images, social media, blogs, ads
✅ **User-Friendly:** Templates, AI pre-fill, platform previews
✅ **Scalable:** Firebase backend, serverless architecture
✅ **Monetizable:** Freemium model with quota management
✅ **Global:** Multi-language, multi-currency support

**Target Users:** Solopreneurs, small businesses, content creators, marketers

**Value Proposition:** Complete AI-powered brand building platform that learns your brand voice and gets smarter over time, unlike generic AI tools.

---

**Document Version:** 1.0
**Last Analysis Date:** 2025-10-05
**Codebase Branch:** master (staged changes present)
**Lines Analyzed:** ~15,000+ across 50+ key files
