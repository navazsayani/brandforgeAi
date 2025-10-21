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

interface TemplateShowcaseEmailProps {
  userName?: string;
  templatesUrl?: string;
}

export const TemplateShowcaseEmail = ({
  userName = 'there',
  templatesUrl = 'https://brandforge.ai/templates',
}: TemplateShowcaseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Skip the setup with 20+ industry templates inside BrandForge AI</Preview>
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
            <Heading style={h1}>No time to set up from scratch{userName ? `, ${userName}` : ''}?</Heading>
            <Text style={heroText}>
              We've got you covered with <strong>20+ ready-made industry templates</strong> that do the heavy lifting for you.
            </Text>
          </Section>

          {/* Templates Section */}
          <Section style={contentSection}>
            <Text style={sectionHeading}>🎯 Industry Templates Built for You</Text>

            <Text style={text}>
              Instead of starting from scratch, pick a template that matches your business. We've pre-configured everything — industry keywords, brand voice, content style — so you can start creating in seconds.
            </Text>

            {/* Template Categories */}
            <div style={categoryContainer}>
              <div style={templateCard}>
                <Text style={templateEmoji}>☕</Text>
                <Text style={templateName}>Coffee Shop</Text>
                <Text style={templateDesc}>Cozy, community-focused content for cafes and coffee businesses</Text>
              </div>

              <div style={templateCard}>
                <Text style={templateEmoji}>🧘‍♀️</Text>
                <Text style={templateName}>Yoga Studio</Text>
                <Text style={templateDesc}>Mindful, wellness-focused posts for yoga and fitness centers</Text>
              </div>

              <div style={templateCard}>
                <Text style={templateEmoji}>💻</Text>
                <Text style={templateName}>Web Developer</Text>
                <Text style={templateDesc}>Technical, professional content for freelance developers</Text>
              </div>

              <div style={templateCard}>
                <Text style={templateEmoji}>🍕</Text>
                <Text style={templateName}>Restaurant</Text>
                <Text style={templateDesc}>Mouth-watering food posts that drive reservations</Text>
              </div>

              <div style={templateCard}>
                <Text style={templateEmoji}>💄</Text>
                <Text style={templateName}>Beauty Salon</Text>
                <Text style={templateDesc}>Glamorous, transformation-focused beauty content</Text>
              </div>

              <div style={templateCard}>
                <Text style={templateEmoji}>🏋️</Text>
                <Text style={templateName}>Gym & Fitness</Text>
                <Text style={templateDesc}>Motivational, results-driven fitness content</Text>
              </div>

              <div style={templateCard}>
                <Text style={templateEmoji}>🛍️</Text>
                <Text style={templateName}>E-commerce Store</Text>
                <Text style={templateDesc}>Product-focused posts that convert browsers into buyers</Text>
              </div>

              <div style={templateCard}>
                <Text style={templateEmoji}>📸</Text>
                <Text style={templateName}>Photography</Text>
                <Text style={templateDesc}>Visual storytelling for photographers and creatives</Text>
              </div>
            </div>

            <Text style={highlightBox}>
              <strong>+ 12 more templates</strong> covering consulting, coaching, real estate, healthcare, and more!
            </Text>

            <Hr style={divider} />

            <Text style={text}>
              <strong>What's included in each template:</strong>
            </Text>

            <ul style={featureList}>
              <li style={featureItem}>✅ Pre-configured brand voice and tone</li>
              <li style={featureItem}>✅ Industry-specific keywords and hashtags</li>
              <li style={featureItem}>✅ Content style optimized for your audience</li>
              <li style={featureItem}>✅ Example posts to inspire you</li>
              <li style={featureItem}>✅ One-click setup — literally 10 seconds</li>
            </ul>

            <Text style={text}>
              No more staring at a blank page wondering what to write. Pick your template, click "Use This," and start creating.
            </Text>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Text style={ctaText}>Ready to skip the setup?</Text>
            <Button style={button} href={templatesUrl}>
              Browse All Templates →
            </Button>
            <Text style={subText}>Free to use. No credit card required.</Text>
          </Section>

          {/* Help Section */}
          <Section style={helpSection}>
            <div style={helpBox}>
              <Text style={helpHeading}>Need help choosing?</Text>
              <Text style={helpText}>
                Not sure which template fits your business? Just reply to this email and tell me about your business — I'll recommend the perfect template for you.
              </Text>
            </div>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Reply to this email — we read every message.
            </Text>
            <Hr style={divider} />
            <Text style={footerText}>
              BrandForge AI - AI-Powered Brand Content Generation
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TemplateShowcaseEmail;

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
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const categoryContainer = {
  margin: '24px 0',
};

const templateCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  textAlign: 'center' as const,
};

const templateEmoji = {
  fontSize: '32px',
  margin: '0 0 8px',
};

const templateName = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const templateDesc = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.4',
};

const highlightBox = {
  backgroundColor: '#FEF3C7',
  border: '2px solid #FCD34D',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  color: '#92400E',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '24px 0',
};

const featureList = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.8',
  paddingLeft: '20px',
  margin: '16px 0',
};

const featureItem = {
  marginBottom: '8px',
};

const ctaSection = {
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const ctaText = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 24px',
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

const helpSection = {
  padding: '0 48px 32px',
};

const helpBox = {
  backgroundColor: '#DBEAFE',
  border: '2px solid #60A5FA',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
};

const helpHeading = {
  color: '#1E40AF',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const helpText = {
  color: '#1E3A8A',
  fontSize: '14px',
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
