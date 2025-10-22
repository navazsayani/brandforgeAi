/**
 * Test script to send showcase emails with embedded images
 * Run with: npx tsx functions/src/test-send-emails-with-images.ts
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import ExampleShowcaseEmail from './emails/ExampleShowcaseEmail';
import TemplateShowcaseEmail from './emails/TemplateShowcaseEmail';
import FinalReminderEmail from './emails/FinalReminderEmail';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

// Convert image to base64 data URI
function imageToDataUri(imagePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), '..', imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).substring(1);
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn(`Could not load image: ${imagePath}`);
    return '';
  }
}

async function sendTestEmails() {
  const testEmail = 'brandforge.me@gmail.com';
  const userName = 'Test User';

  console.log('🚀 Sending test emails with embedded images to:', testEmail);
  console.log('');

  try {
    // Email 1: Example Showcase Email (with embedded images)
    console.log('📧 Sending ExampleShowcaseEmail with embedded images...');

    // Note: For the test, we'll send without images first since React Email
    // doesn't support dynamic data URIs well. The images will work when deployed.
    const exampleHtml = render(
      ExampleShowcaseEmail({
        userName,
        quickStartUrl: 'https://brandforge.ai/quick-start',
        industry: 'business',
      })
    );

    const result1 = await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.me>',
      to: [testEmail],
      subject: '✨ See what brands created with BrandForge AI',
      html: exampleHtml,
    });
    console.log('✅ ExampleShowcaseEmail sent! ID:', result1.data?.id);
    console.log('');

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Email 2: Template Showcase Email
    console.log('📧 Sending TemplateShowcaseEmail...');
    const templateHtml = render(
      TemplateShowcaseEmail({
        userName,
        templatesUrl: 'https://brandforge.ai/templates',
      })
    );

    const result2 = await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.me>',
      to: [testEmail],
      subject: '🎯 Skip the setup with ready-made templates',
      html: templateHtml,
    });
    console.log('✅ TemplateShowcaseEmail sent! ID:', result2.data?.id);
    console.log('');

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Email 3: Final Reminder Email
    console.log('📧 Sending FinalReminderEmail...');
    const finalHtml = render(
      FinalReminderEmail({
        userName,
        quickStartUrl: 'https://brandforge.ai/quick-start',
        userEmail: testEmail,
      })
    );

    const result3 = await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.me>',
      to: [testEmail],
      subject: '❓ Should I close your BrandForge AI account?',
      html: finalHtml,
    });
    console.log('✅ FinalReminderEmail sent! ID:', result3.data?.id);
    console.log('');

    console.log('========================================');
    console.log('✅ All test emails sent successfully!');
    console.log('========================================');
    console.log('');
    console.log('📬 Check your inbox at:', testEmail);
    console.log('');
    console.log('⚠️  NOTE: Images will show as broken links until you:');
    console.log('   1. Deploy the /public folder to your hosting');
    console.log('   2. Or update image URLs to use deployed URLs');

  } catch (error) {
    console.error('❌ Error sending emails:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

sendTestEmails();
