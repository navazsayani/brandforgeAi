/**
 * Simple test to verify Resend is working
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testSimpleEmail() {
  console.log('Testing Resend API...');
  console.log('API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  console.log('From Email:', process.env.RESEND_FROM_EMAIL);
  console.log('');

  try {
    const result = await resend.emails.send({
      from: 'BrandForge AI <hello@brandforge.me>',
      to: ['brandforge.me@gmail.com'],
      subject: 'Test Email from BrandForge AI',
      html: '<h1>Test Email</h1><p>This is a simple test to verify email delivery.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testSimpleEmail();
