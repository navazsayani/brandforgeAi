
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-images.ts';
import '@/ai/flows/generate-ad-campaign.ts';
import '@/ai/flows/generate-social-media-caption.ts';
import '@/ai/flows/generate-blog-content.ts';
import '@/ai/flows/extract-brand-info-from-url-flow.ts';
import '@/ai/flows/describe-image-flow.ts';
import '@/ai/flows/generate-blog-outline-flow.ts';
import '@/ai/flows/generate-brand-logo-flow.ts';
import '@/ai/flows/generate-brandforge-app-logo-flow.ts'; // Added new flow for app logo
import '@/ai/flows/enhance-brand-description-flow.ts';
import '@/ai/flows/populate-image-form-flow.ts';
import '@/ai/flows/populate-social-form-flow.ts';
import '@/ai/flows/populate-blog-form-flow.ts';
import '@/ai/flows/populate-ad-campaign-form-flow.ts';
