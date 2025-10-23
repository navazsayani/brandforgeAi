/**
 * Test script to send all activation emails to a test email address
 * Run with: npx tsx send-test-emails.ts
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import ActivationReminderEmail from './src/emails/ActivationReminderEmail';
import ExampleShowcaseEmail from './src/emails/ExampleShowcaseEmail';
import TemplateShowcaseEmail from './src/emails/TemplateShowcaseEmail';
import FinalReminderEmail from './src/emails/FinalReminderEmail';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const TEST_EMAIL = 'brandforge.me@gmail.com';
const TEST_USER_NAME = 'BrandForge Team';
const APP_URL = 'https://www.brandforge.me';

async function sendTestEmail(
  emailName: string,
  subject: string,
  component: React.ReactElement
) {
  try {
    console.log(`\n🚀 Sending ${emailName}...`);

    const html = await render(component);

    const result = await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.me>',
      to: [TEST_EMAIL],
      subject: `[TEST] ${subject}`,
      html,
    });

    console.log(`✅ ${emailName} sent successfully!`);
    console.log(`   Full result:`, JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Failed to send ${emailName}:`);
    console.error('   Error details:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    return false;
  }
}

async function sendAllTestEmails() {
  console.log('================================================');
  console.log('  BrandForge AI - Test Email Sender');
  console.log('================================================');
  console.log(`\nSending test emails to: ${TEST_EMAIL}\n`);

  const emails = [
    {
      name: 'Email #2: Activation Reminder (+2h)',
      subject: "Quick question - what's blocking you?",
      component: ActivationReminderEmail({
        userName: TEST_USER_NAME,
        quickStartUrl: `${APP_URL}/quick-start`,
      }),
    },
    {
      name: 'Email #3: Example Showcase (+24h)',
      subject: 'See what business brands created with BrandForge AI in 30 seconds',
      component: ExampleShowcaseEmail({
        userName: TEST_USER_NAME,
        quickStartUrl: `${APP_URL}/quick-start`,
        industry: 'business',
      }),
    },
    {
      name: 'Email #4: Template Showcase (+3 days)',
      subject: 'Skip the setup with 20+ industry templates inside BrandForge AI',
      component: TemplateShowcaseEmail({
        userName: TEST_USER_NAME,
        templatesUrl: `${APP_URL}/templates`,
      }),
    },
    {
      name: 'Email #5: Final Reminder (+7 days)',
      subject: 'Should I close your BrandForge AI account? (One last quick win inside)',
      component: FinalReminderEmail({
        userName: TEST_USER_NAME,
        quickStartUrl: `${APP_URL}/quick-start`,
        userEmail: TEST_EMAIL,
      }),
    },
  ];

  let successCount = 0;

  for (const email of emails) {
    const success = await sendTestEmail(email.name, email.subject, email.component);
    if (success) successCount++;

    // Wait 2 seconds between emails to avoid rate limits
    if (email !== emails[emails.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n================================================');
  console.log(`  Results: ${successCount}/${emails.length} emails sent successfully`);
  console.log('================================================\n');
  console.log(`Check your inbox at ${TEST_EMAIL}`);
  console.log('Note: Emails may take 1-2 minutes to arrive\n');
}

// Run the script
sendAllTestEmails().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
