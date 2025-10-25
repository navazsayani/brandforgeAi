/**
 * Firebase Analytics + Google Analytics 4 Integration
 *
 * This utility provides type-safe event tracking that automatically
 * sends data to both Firebase Analytics and Google Analytics 4.
 *
 * Features:
 * - Automatic user ID tracking
 * - User property segmentation
 * - Custom event logging
 * - E-commerce event tracking
 * - Type-safe event parameters
 */

import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getAnalyticsInstance } from '@/lib/firebaseConfig';

/**
 * Track custom event
 * Automatically logged to Firebase Analytics + GA4
 * Gracefully handles cases where analytics is not initialized
 */
export const trackEvent = async (
  eventName: string,
  params?: Record<string, any>
) => {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      logEvent(analytics, eventName, params);
      console.log('[Analytics] Event tracked:', eventName, params);
    } else {
      console.log('[Analytics] Skipped (not initialized):', eventName, params);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', eventName, error);
  }
};

/**
 * Set user ID for tracking across sessions
 * Links anonymous browsing to authenticated user
 */
export const setAnalyticsUserId = async (userId: string | null) => {
  if (!userId) return;

  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      setUserId(analytics, userId);
      console.log('[Analytics] User ID set:', userId);
    }
  } catch (error) {
    console.error('[Analytics] Error setting user ID:', error);
  }
};

/**
 * Set user properties for segmentation
 * Used to create audiences and analyze user cohorts
 */
export const setAnalyticsUserProperties = async (properties: Record<string, any>) => {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      setUserProperties(analytics, properties);
      console.log('[Analytics] User properties set:', properties);
    }
  } catch (error) {
    console.error('[Analytics] Error setting user properties:', error);
  }
};

// ===== PREDEFINED EVENTS FOR TYPE SAFETY =====

/**
 * Track user signup
 * @param method - Authentication method used
 */
export const trackSignup = (method: 'email' | 'google') => {
  trackEvent('sign_up', {
    method,
  });
};

/**
 * Track user login
 * @param method - Authentication method used
 */
export const trackLogin = (method: 'email' | 'google') => {
  trackEvent('login', {
    method,
  });
};

/**
 * Track Quick Start completion
 * @param industry - User's industry (optional)
 */
export const trackQuickStartComplete = (industry?: string) => {
  trackEvent('quick_start_complete', {
    industry: industry || 'unknown',
  });
};

/**
 * Track brand profile completion
 * Fired when user completes their first brand profile
 */
export const trackBrandProfileComplete = () => {
  trackEvent('brand_profile_complete', {});
};

/**
 * Track content generation
 * @param contentType - Type of content generated
 * @param provider - AI provider used (google, fireworks, openai)
 */
export const trackContentGeneration = (
  contentType: 'social_post' | 'blog' | 'image' | 'logo' | 'ad_campaign',
  provider?: string
) => {
  trackEvent('content_generated', {
    content_type: contentType,
    provider: provider || 'unknown',
  });
};

/**
 * Track image generation specifically
 * @param numberOfImages - Number of images generated
 * @param provider - AI provider used
 * @param aspectRatio - Image aspect ratio
 */
export const trackImageGeneration = (
  numberOfImages: number,
  provider: string,
  aspectRatio?: string
) => {
  trackEvent('generate_image', {
    number_of_images: numberOfImages,
    provider,
    aspect_ratio: aspectRatio || 'unknown',
  });
};

/**
 * Track AI refinement usage
 * @param refinementType - Type of refinement (iterative feedback or AI-driven)
 * @param iterationNumber - Which iteration this is
 */
export const trackImageRefinement = (
  refinementType: 'iterative' | 'feedback',
  iterationNumber?: number
) => {
  trackEvent('image_refinement', {
    refinement_type: refinementType,
    iteration_number: iterationNumber || 1,
  });
};

/**
 * Track social sharing
 * @param platform - Social platform shared to
 */
export const trackSocialShare = (platform: 'twitter' | 'linkedin' | 'native' | 'copy') => {
  trackEvent('share', {
    method: platform,
    content_type: 'ai_generated_content',
  });
};

/**
 * Track template usage
 * @param templateId - Unique template identifier
 * @param templateName - Human-readable template name
 */
export const trackTemplateUsed = (templateId: string, templateName: string) => {
  trackEvent('template_used', {
    template_id: templateId,
    template_name: templateName,
  });
};

/**
 * Track page view (for SPA navigation)
 * @param pagePath - URL path
 * @param pageTitle - Page title (optional)
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || (typeof document !== 'undefined' ? document.title : 'Unknown'),
  });
};

/**
 * Track premium upgrade attempt
 * @param plan - Plan user is attempting to purchase
 * @param source - Where the upgrade was initiated from
 */
export const trackUpgradeAttempt = (plan: string, source: string) => {
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: plan === 'premium' ? 29 : 0,
    items: [
      {
        item_id: plan,
        item_name: `BrandForge AI ${plan}`,
      },
    ],
    checkout_source: source,
  });
};

/**
 * Track successful purchase (premium conversion)
 * @param plan - Plan purchased
 * @param value - Purchase amount
 * @param currency - Currency code (default: USD)
 */
export const trackPurchase = (
  plan: string,
  value: number,
  currency: string = 'USD'
) => {
  trackEvent('purchase', {
    currency,
    value,
    transaction_id: `${Date.now()}_${plan}`,
    items: [
      {
        item_id: plan,
        item_name: `BrandForge AI ${plan}`,
        price: value,
      },
    ],
  });
};

/**
 * Track feature engagement
 * @param featureName - Name of the feature used
 * @param details - Additional details about usage
 */
export const trackFeatureUsage = (featureName: string, details?: Record<string, any>) => {
  trackEvent('feature_usage', {
    feature_name: featureName,
    ...details,
  });
};

/**
 * Track when user downloads generated content
 * @param contentType - Type of content downloaded
 */
export const trackDownload = (contentType: 'image' | 'caption' | 'blog') => {
  trackEvent('download', {
    content_type: contentType,
  });
};

/**
 * Track when user navigates to showcase
 */
export const trackShowcaseView = () => {
  trackEvent('showcase_view', {});
};

/**
 * Track when user views a template
 * @param templateId - Template identifier
 */
export const trackTemplateView = (templateId: string) => {
  trackEvent('template_view', {
    template_id: templateId,
  });
};
