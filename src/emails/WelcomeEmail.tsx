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

interface WelcomeEmailProps {
  userName?: string;
  quickStartUrl?: string;
}

export const WelcomeEmail = ({
  userName = 'there',
  quickStartUrl = 'https://brandforge.ai/quick-start',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BrandForge AI! Create your first post in 30 seconds ⚡</Preview>
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
            <Heading style={h1}>Welcome aboard{userName ? `, ${userName}` : ''}! 🎉</Heading>
            <Text style={heroText}>
              You're about to discover how easy it is to create professional content for your brand — no design skills needed.
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Text style={text}>
              Here's what makes BrandForge AI special:
            </Text>

            {/* Feature List */}
            <Section style={featureBox}>
              <Text style={featureItem}>⚡ <strong>30-second setup</strong> - Get started instantly</Text>
              <Text style={featureItem}>🎨 <strong>AI-powered design</strong> - Professional results every time</Text>
              <Text style={featureItem}>🚀 <strong>Multiple formats</strong> - Instagram posts, blogs, ads & more</Text>
              <Text style={featureItem}>💯 <strong>100% free to start</strong> - No credit card required</Text>
            </Section>

            <Text style={text}>
              Ready to create your first AI-generated Instagram post?
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={quickStartUrl}>
                Generate My First Post →
              </Button>
            </Section>

            <Text style={subtext}>
              Takes just 30 seconds. No setup required.
            </Text>
          </Section>

          {/* Tips Section */}
          <Section style={tipsSection}>
            <Text style={tipsHeading}>💡 Pro Tips for Your First Post:</Text>
            <Text style={tipText}>• Be specific about your business (e.g., "Organic coffee shop for remote workers")</Text>
            <Text style={tipText}>• Mention your unique value proposition</Text>
            <Text style={tipText}>• The AI will handle the rest - caption, hashtags, and image!</Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Just reply to this email - we're here to help!
            </Text>
            <Text style={footerSignature}>
              Happy creating! 🎨<br />
              The BrandForge AI Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const heroText = {
  color: '#4a5568',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0',
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

const featureBox = {
  backgroundColor: '#f8f9ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const featureItem = {
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

const tipsSection = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  padding: '20px 24px',
  margin: '0 40px 30px',
  borderRadius: '4px',
};

const tipsHeading = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const tipText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px',
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
