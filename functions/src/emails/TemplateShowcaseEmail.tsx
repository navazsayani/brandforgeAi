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

// Template previews from showcase
const templatePreviews = [
  {
    id: 'daily-grind-coffee',
    name: 'Coffee Shop',
    emoji: '☕',
    description: 'Cozy, community-focused content for cafes and coffee businesses',
    logo: 'https://brandforge.me/showcase/examples/daily-grind-coffee/logo.png',
    previewImage: 'https://brandforge.me/showcase/examples/daily-grind-coffee/posts/post-1-image.png',
  },
  {
    id: 'zen-flow-yoga',
    name: 'Yoga Studio',
    emoji: '🧘‍♀️',
    description: 'Mindful, wellness-focused posts for yoga and fitness centers',
    logo: 'https://brandforge.me/showcase/examples/zen-flow-yoga/logo.png',
    previewImage: 'https://brandforge.me/showcase/examples/zen-flow-yoga/posts/post-1-image.png',
  },
  {
    id: 'elevate-consulting',
    name: 'Business Consulting',
    emoji: '💼',
    description: 'Professional, strategic content for consultants and advisors',
    logo: 'https://brandforge.me/showcase/examples/elevate-consulting/logo.png',
    previewImage: 'https://brandforge.me/showcase/examples/elevate-consulting/posts/post-1-image.png',
  },
  {
    id: 'artisan-table',
    name: 'Restaurant',
    emoji: '🍽️',
    description: 'Mouth-watering food posts that drive reservations',
    logo: 'https://brandforge.me/showcase/examples/artisan-table/logo.png',
    previewImage: 'https://brandforge.me/showcase/examples/artisan-table/posts/post-1-image.png',
  },
  {
    id: 'bloom-beauty',
    name: 'Beauty Salon',
    emoji: '💄',
    description: 'Glamorous, transformation-focused beauty content',
    logo: 'https://brandforge.me/showcase/examples/bloom-beauty/logo.png',
    previewImage: 'https://brandforge.me/showcase/examples/bloom-beauty/posts/post-1-image.png',
  },
  {
    id: 'fitlife-performance',
    name: 'Gym & Fitness',
    emoji: '🏋️',
    description: 'Motivational, results-driven fitness content',
    logo: 'https://brandforge.me/showcase/examples/fitlife-performance/logo.png',
    previewImage: 'https://brandforge.me/showcase/examples/fitlife-performance/posts/post-1-image.png',
  },
];

interface TemplateShowcaseEmailProps {
  userName?: string;
  templatesUrl?: string;
}

export const TemplateShowcaseEmail = ({
  userName = 'there',
  templatesUrl = 'https://brandforge.me/templates',
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

            {/* Template Categories with Visual Previews */}
            <div style={categoryContainer}>
              {templatePreviews.map((template) => (
                <div key={template.id} style={templateCard}>
                  <Img
                    src={template.previewImage}
                    alt={`${template.name} example`}
                    width="560"
                    height="560"
                    style={templatePreviewImage}
                  />
                  <table width="100%" cellPadding="0" cellSpacing="0" style={templateContent}>
                    <tr>
                      <td width="56" style={{paddingRight: '12px', verticalAlign: 'top'}}>
                        <Img
                          src={template.logo}
                          alt={template.name}
                          width="48"
                          height="48"
                          style={templateLogoIcon}
                        />
                      </td>
                      <td style={{verticalAlign: 'middle'}}>
                        <table width="100%" cellPadding="0" cellSpacing="0">
                          <tr>
                            <td>
                              <Text style={templateEmoji}>{template.emoji}</Text>
                              <Text style={templateName}>{template.name}</Text>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <Text style={templateDesc}>{template.description}</Text>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
              ))}
            </div>

            <Text style={highlightBox}>
              <strong>+ 2 more templates</strong> for fashion and skincare businesses!
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
  backgroundColor: '#ffffff',
  border: '2px solid #e5e7eb',
  borderRadius: '12px',
  marginBottom: '16px',
  overflow: 'hidden' as const,
};

const templatePreviewImage = {
  width: '100%',
  height: 'auto',
  display: 'block',
  borderTopLeftRadius: '12px',
  borderTopRightRadius: '12px',
};

const templateLogoIcon = {
  display: 'block',
  borderRadius: '8px',
  border: '2px solid #e5e7eb',
};

const templateContent = {
  padding: '16px',
};

const templateEmoji = {
  fontSize: '20px',
  margin: '0 8px 0 0',
  display: 'inline-block',
  verticalAlign: 'middle',
};

const templateName = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
  display: 'inline-block',
  verticalAlign: 'middle',
};

const templateDesc = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.5',
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
