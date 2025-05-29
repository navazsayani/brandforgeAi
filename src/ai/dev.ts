
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-images.ts';
import '@/ai/flows/generate-ad-campaign.ts';
import '@/ai/flows/generate-social-media-caption.ts';
import '@/ai/flows/generate-blog-content.ts';
import '@/ai/flows/extract-brand-info-from-url-flow.ts';
import '@/ai/flows/describe-image-flow.ts';
import '@/ai/flows/generate-blog-outline-flow.ts'; // Added new flow
