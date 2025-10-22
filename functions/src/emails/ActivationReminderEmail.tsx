import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface ActivationReminderEmailProps {
  userName?: string;
  quickStartUrl?: string;
}

export const ActivationReminderEmail = ({
  userName = 'there',
  quickStartUrl = 'https://brandforge.me/quick-start',
}: ActivationReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Quick question - what's holding you back?</Preview>
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
            <Heading style={h1}>Hey{userName ? ` ${userName}` : ''}, quick question...</Heading>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Text style={text}>
              I noticed you signed up a couple hours ago, but haven't created your first AI post yet.
            </Text>

            <Text style={text}>
              Is something confusing? Technical issue? Not sure where to start?
            </Text>

            {/* Help Box */}
            <Section style={helpBox}>
              <Text style={helpHeading}>🤝 We're here to help!</Text>
              <Text style={helpText}>
                Just reply to this email with any questions. We typically respond within 30 minutes during business hours.
              </Text>
            </Section>

            <Text style={text}>
              Or if you're ready now, here's how easy it is:
            </Text>

            {/* Steps */}
            <Section style={stepsBox}>
              <Text style={stepItem}><strong>Step 1:</strong> Click the button below</Text>
              <Text style={stepItem}><strong>Step 2:</strong> Describe your business in one sentence</Text>
              <Text style={stepItem}><strong>Step 3:</strong> Watch AI create your Instagram post (takes 30 sec)</Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={quickStartUrl}>
                Try Quick Start Now →
              </Button>
            </Section>

            <Text style={subtext}>
              Takes 30 seconds. Zero setup required.
            </Text>
          </Section>

          {/* Testimonial */}
          <Section style={testimonialSection}>
            <Text style={testimonialQuote}>
              "I was skeptical at first, but wow! Created my first Instagram post in under a minute. The AI nailed my brand voice."
            </Text>
            <Text style={testimonialAuthor}>
              — Sarah, Coffee Shop Owner
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              No pressure! We're here when you're ready. 😊
            </Text>
            <Text style={footerSignature}>
              Cheers,<br />
              The BrandForge AI Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ActivationReminderEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const header = {
  backgroundColor: '#6366f1',
  padding: '20px 40px',
};

const logoContainer = {
  textAlign: 'center' as const,
};

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
};

const heroSection = {
  backgroundColor: '#f8f9ff',
  padding: '40px 40px 30px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '26px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.3',
};

const contentSection = {
  padding: '40px 40px 20px',
};

const text = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const helpBox = {
  backgroundColor: '#e0f2fe',
  borderLeft: '4px solid #0ea5e9',
  borderRadius: '4px',
  padding: '20px 24px',
  margin: '24px 0',
};

const helpHeading = {
  color: '#075985',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const helpText = {
  color: '#0c4a6e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const stepsBox = {
  backgroundColor: '#f8f9ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const stepItem = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '0 0 12px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 16px',
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 40px',
  boxShadow: '0 4px 6px rgba(99, 102, 241, 0.3)',
};

const subtext = {
  color: '#718096',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
  fontStyle: 'italic',
};

const testimonialSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 40px 30px',
};

const testimonialQuote = {
  color: '#78350f',
  fontSize: '16px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const testimonialAuthor = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 40px',
};

const footer = {
  padding: '0 40px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const footerSignature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};
