/**
 * Test script to send showcase emails
 * Run with: npx tsx functions/src/test-send-emails.ts
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import ExampleShowcaseEmail from './emails/ExampleShowcaseEmail';
import TemplateShowcaseEmail from './emails/TemplateShowcaseEmail';
import FinalReminderEmail from './emails/FinalReminderEmail';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmails() {
  const testEmail = 'brandforge.me@gmail.com';
  const userName = 'Test User';

  console.log('🚀 Sending test emails to:', testEmail);
  console.log('');

  try {
    // Email 1: Example Showcase Email
    console.log('📧 Sending ExampleShowcaseEmail...');
    const exampleHtml = render(
      ExampleShowcaseEmail({
        userName,
        quickStartUrl: 'https://brandforge.ai/quick-start',
        industry: 'business',
      })
    );

    await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.ai>',
      to: [testEmail],
      subject: 'See what brands created with BrandForge AI in 30 seconds',
      html: exampleHtml,
    });
    console.log('✅ ExampleShowcaseEmail sent!');
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

    await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.ai>',
      to: [testEmail],
      subject: 'Skip the setup with 20+ industry templates',
      html: templateHtml,
    });
    console.log('✅ TemplateShowcaseEmail sent!');
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

    await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.ai>',
      to: [testEmail],
      subject: 'Should I close your BrandForge AI account?',
      html: finalHtml,
    });
    console.log('✅ FinalReminderEmail sent!');
    console.log('');

    console.log('========================================');
    console.log('✅ All test emails sent successfully!');
    console.log('========================================');
    console.log('');
    console.log('Check your inbox at:', testEmail);

  } catch (error) {
    console.error('❌ Error sending emails:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

sendTestEmails();
