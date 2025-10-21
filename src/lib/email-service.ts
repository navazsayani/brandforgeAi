import { Resend } from 'resend';
import { render } from '@react-email/components';
import WelcomeEmail from '@/emails/WelcomeEmail';
import ActivationReminderEmail from '@/emails/ActivationReminderEmail';
import ExampleShowcaseEmail from '@/emails/ExampleShowcaseEmail';
import TemplateShowcaseEmail from '@/emails/TemplateShowcaseEmail';
import FinalReminderEmail from '@/emails/FinalReminderEmail';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Your verified sender email (update this to your actual domain email)
// For testing, you can use: onboarding@resend.dev
// For production, use: hello@brandforge.ai (or whatever you verified in Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Generic function to send email via Resend
 */
async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const emailOptions: any = {
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    };

    // Add reply-to if configured (Resend uses camelCase: replyTo)
    if (REPLY_TO_EMAIL) {
      emailOptions.replyTo = REPLY_TO_EMAIL;
    }

    const result = await resend.emails.send(emailOptions);

    console.log('[Email Service] Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * Send welcome email to new user (Email #1)
 * Triggered immediately after signup
 */
export async function sendWelcomeEmail({
  to,
  userName,
  userId,
}: {
  to: string;
  userName?: string;
  userId: string;
}) {
  const quickStartUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://brandforge.ai'}/quick-start`;

  const html = await render(
    WelcomeEmail({
      userName: userName || 'there',
      quickStartUrl,
    })
  );

  return sendEmail({
    to,
    subject: 'Welcome to BrandForge AI! Create your first post in 30 seconds ⚡',
    html,
  });
}

/**
 * Send activation reminder email (Email #2)
 * Triggered +2 hours after signup if user hasn't completed Quick Start
 */
export async function sendActivationReminderEmail({
  to,
  userName,
  userId,
}: {
  to: string;
  userName?: string;
  userId: string;
}) {
  const quickStartUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://brandforge.ai'}/quick-start`;

  const html = await render(
    ActivationReminderEmail({
      userName: userName || 'there',
      quickStartUrl,
    })
  );

  return sendEmail({
    to,
    subject: 'Quick question - what\'s blocking you?',
    html,
  });
}

/**
 * Send example showcase email (Email #3)
 * Triggered +24 hours after signup if still no activity
 */
export async function sendExampleShowcaseEmail({
  to,
  userName,
  industry,
}: {
  to: string;
  userName?: string;
  industry?: string;
}) {
  const quickStartUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://brandforge.ai'}/quick-start`;

  const html = await render(
    ExampleShowcaseEmail({
      userName: userName || 'there',
      quickStartUrl,
      industry: industry || 'business',
    })
  );

  return sendEmail({
    to,
    subject: `See what ${industry || 'business'} brands created with BrandForge AI in 30 seconds`,
    html,
  });
}

/**
 * Send template showcase email (Email #4)
 * Triggered +3 days after signup if still no activity
 */
export async function sendTemplateShowcaseEmail({
  to,
  userName,
}: {
  to: string;
  userName?: string;
}) {
  const templatesUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://brandforge.ai'}/templates`;

  const html = await render(
    TemplateShowcaseEmail({
      userName: userName || 'there',
      templatesUrl,
    })
  );

  return sendEmail({
    to,
    subject: 'Skip the setup with 20+ industry templates inside BrandForge AI',
    html,
  });
}

/**
 * Send final reminder email (Email #5)
 * Triggered +7 days after signup if still no activity
 */
export async function sendFinalReminderEmail({
  to,
  userName,
  userEmail,
}: {
  to: string;
  userName?: string;
  userEmail?: string;
}) {
  const quickStartUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://brandforge.ai'}/quick-start`;

  const html = await render(
    FinalReminderEmail({
      userName: userName || 'there',
      quickStartUrl,
      userEmail: userEmail || to,
    })
  );

  return sendEmail({
    to,
    subject: 'Should I close your BrandForge AI account? (One last quick win inside)',
    html,
  });
}

export default {
  sendWelcomeEmail,
  sendActivationReminderEmail,
  sendExampleShowcaseEmail,
  sendTemplateShowcaseEmail,
  sendFinalReminderEmail,
};
