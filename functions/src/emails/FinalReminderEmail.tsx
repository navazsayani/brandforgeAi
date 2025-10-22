import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

// Real testimonials from showcase users
const testimonials = [
  {
    quote: 'Created my first Instagram post in 40 seconds. The AI absolutely nailed my brand voice and the image quality is incredible!',
    author: 'Sarah Martinez',
    role: 'Coffee Shop Owner',
    location: 'Seattle, WA',
    avatar: 'https://brandforge.me/showcase/testimonials/avatars/daily-grind-coffee.jpg',
  },
  {
    quote: 'The posts perfectly capture the peaceful, welcoming vibe of our studio. Our Instagram engagement has doubled since using BrandForge!',
    author: 'Maya Chen',
    role: 'Yoga Instructor & Studio Owner',
    location: 'Portland, OR',
    avatar: 'https://brandforge.me/showcase/testimonials/avatars/zen-flow-yoga.jpg',
  },
  {
    quote: 'As a consultant, I needed content that looks professional yet approachable. BrandForge nails it every time. Saves me hours every week!',
    author: 'Michael Foster',
    role: 'Business Strategy Consultant',
    location: 'Austin, TX',
    avatar: 'https://brandforge.me/showcase/testimonials/avatars/elevate-consulting.jpg',
  },
];

interface FinalReminderEmailProps {
  userName?: string;
  quickStartUrl?: string;
  userEmail?: string;
}

export const FinalReminderEmail = ({
  userName = 'there',
  quickStartUrl = 'https://brandforge.me/quick-start',
  userEmail = '',
}: FinalReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Should I close your BrandForge AI account? (One last quick win inside)</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Section style={header}>
            <div style={logoContainer}>
              <Text style={logoText}>✨ BrandForge AI</Text>
            </div>
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Heading style={h1}>Should I close your account{userName ? `, ${userName}` : ''}?</Heading>
            <Text style={heroText}>
              I noticed you signed up a week ago but haven't been back. That's totally okay — maybe BrandForge AI isn't for you right now.
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Text style={text}>
              I can delete your account to keep your data clean. Just reply to this email with "Yes, please close my account" and I'll take care of it.
            </Text>

            <Hr style={divider} />

            <Text style={sectionHeading}>Or... give it one quick try?</Text>

            <Text style={text}>
              Before you go, here's the fastest way to see what BrandForge AI can do:
            </Text>

            <div style={stepBox}>
              <div style={stepNumber}>1</div>
              <div style={stepContent}>
                <Text style={stepTitle}>Click the button below</Text>
                <Text style={stepDesc}>Takes you straight to Quick Start</Text>
              </div>
            </div>

            <div style={stepBox}>
              <div style={stepNumber}>2</div>
              <div style={stepContent}>
                <Text style={stepTitle}>Describe your business in one sentence</Text>
                <Text style={stepDesc}>Example: "Yoga studio for busy professionals"</Text>
              </div>
            </div>

            <div style={stepBox}>
              <div style={stepNumber}>3</div>
              <div style={stepContent}>
                <Text style={stepTitle}>Get a complete Instagram post</Text>
                <Text style={stepDesc}>Image + caption + hashtags in 30 seconds</Text>
              </div>
            </div>

            <Text style={highlightBox}>
              <strong>That's it.</strong> No setup. No learning curve. Just results.
            </Text>

            <Hr style={divider} />

            <Text style={text}>
              If it works for you, great! If not, no hard feelings — I'll delete your account whenever you want.
            </Text>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Button style={button} href={quickStartUrl}>
              Try Quick Start (30 seconds) →
            </Button>
            <Text style={subText}>Or reply "Close my account" to delete</Text>
          </Section>

          {/* Empathy Section */}
          <Section style={empathySection}>
            <div style={empathyBox}>
              <Text style={empathyHeading}>Why am I reaching out?</Text>
              <Text style={empathyText}>
                Honestly? I want to understand why you didn't use BrandForge AI. Was something confusing? Technical issue? Not the right fit?
              </Text>
              <Text style={empathyText}>
                Your feedback helps me make this better for everyone. Even a one-sentence reply would be incredibly helpful.
              </Text>
              <Text style={empathySignature}>
                — The BrandForge Team
              </Text>
            </div>
          </Section>

          {/* Stats Section - Social Proof */}
          <Section style={statsSection}>
            <Text style={statsHeading}>What others are saying:</Text>
            {testimonials.map((testimonial, index) => (
              <div key={index} style={testimonialBox}>
                <div style={testimonialHeader}>
                  <Img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    width="48"
                    height="48"
                    style={testimonialAvatar}
                  />
                  <div>
                    <Text style={testimonialAuthorName}>{testimonial.author}</Text>
                    <Text style={testimonialAuthorRole}>{testimonial.role}</Text>
                  </div>
                </div>
                <Text style={testimonialText}>"{testimonial.quote}"</Text>
              </div>
            ))}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Have questions? Want to give feedback? Just reply — I read every message personally.
            </Text>
            <Hr style={divider} />
            <Text style={footerText}>
              BrandForge AI - AI-Powered Brand Content Generation
            </Text>
            {userEmail && (
              <Text style={footerText}>
                This email was sent to {userEmail}
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default FinalReminderEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const logoContainer = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#7C3AED',
  borderRadius: '8px',
};

const logoText = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
};

const heroSection = {
  padding: '0 48px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const heroText = {
  color: '#525252',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0 0 32px',
};

const contentSection = {
  padding: '32px 48px',
};

const sectionHeading = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const stepBox = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '20px',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const stepNumber = {
  backgroundColor: '#7C3AED',
  color: '#ffffff',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '16px',
  marginRight: '16px',
  flexShrink: 0,
};

const stepContent = {
  flex: 1,
};

const stepTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const stepDesc = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const highlightBox = {
  backgroundColor: '#FEF3C7',
  border: '2px solid #FCD34D',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  color: '#92400E',
  fontSize: '16px',
  margin: '24px 0',
};

const ctaSection = {
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#7C3AED',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 0 16px',
};

const subText = {
  color: '#737373',
  fontSize: '14px',
  margin: '0',
};

const empathySection = {
  padding: '0 48px 32px',
};

const empathyBox = {
  backgroundColor: '#F0F9FF',
  border: '2px solid #7DD3FC',
  borderRadius: '8px',
  padding: '24px',
};

const empathyHeading = {
  color: '#075985',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const empathyText = {
  color: '#0C4A6E',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const empathySignature = {
  color: '#0C4A6E',
  fontSize: '15px',
  fontStyle: 'italic',
  margin: '16px 0 0',
};

const statsSection = {
  padding: '0 48px 32px',
};

const statsHeading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const testimonialBox = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #7C3AED',
  padding: '20px',
  marginBottom: '16px',
  borderRadius: '8px',
};

const testimonialHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px',
};

const testimonialAvatar = {
  borderRadius: '50%',
  objectFit: 'cover' as const,
};

const testimonialAuthorName = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '0 0 2px',
};

const testimonialAuthorRole = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};

const testimonialText = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0',
};

const footer = {
  padding: '24px 48px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#737373',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};
