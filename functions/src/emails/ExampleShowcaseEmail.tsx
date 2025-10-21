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

interface ExampleShowcaseEmailProps {
  userName?: string;
  quickStartUrl?: string;
  industry?: string;
}

export const ExampleShowcaseEmail = ({
  userName = 'there',
  quickStartUrl = 'https://brandforge.ai/quick-start',
  industry = 'business',
}: ExampleShowcaseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>See what {industry} brands created with BrandForge AI in 30 seconds</Preview>
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
            <Heading style={h1}>Still on the fence{userName ? `, ${userName}` : ''}?</Heading>
            <Text style={heroText}>
              Check out what other {industry} brands created with BrandForge AI — in under a minute.
            </Text>
          </Section>

          {/* Example Posts Section */}
          <Section style={contentSection}>
            <Text style={sectionHeading}>🎨 Real Examples from {industry === 'business' ? 'Businesses' : industry} Like Yours</Text>

            {/* Example 1 */}
            <div style={exampleCard}>
              <Text style={exampleLabel}>Coffee Shop</Text>
              <Text style={exampleInput}>Input: "Organic coffee shop for remote workers"</Text>
              <div style={exampleResultBox}>
                <Text style={exampleResultLabel}>✨ Generated Instagram Post:</Text>
                <Text style={exampleCaption}>
                  "Perfect blend of productivity and comfort ☕️✨

                  Finding the right workspace can transform your day. At [Your Coffee Shop], we've created a haven for remote workers who need more than just caffeine — you need community, fast WiFi, and that perfect ambient buzz.

                  Come experience the difference. Your best work starts here."
                </Text>
                <Text style={exampleHashtags}>
                  #RemoteWork #CoffeeShop #WorkFromCafe #DigitalNomad #Productivity
                </Text>
              </div>
            </div>

            {/* Example 2 */}
            <div style={exampleCard}>
              <Text style={exampleLabel}>Yoga Studio</Text>
              <Text style={exampleInput}>Input: "Yoga studio for busy professionals"</Text>
              <div style={exampleResultBox}>
                <Text style={exampleResultLabel}>✨ Generated Instagram Post:</Text>
                <Text style={exampleCaption}>
                  "Stressed? Overworked? You're not alone. 🧘‍♀️

                  Our early morning and lunch-break classes are designed for professionals who need to recharge — fast. No judgment, no pressure, just pure mindfulness.

                  Book your first class (it's free!) and feel the difference."
                </Text>
                <Text style={exampleHashtags}>
                  #YogaForProfessionals #StressRelief #MindfulLiving #WorkLifeBalance
                </Text>
              </div>
            </div>

            {/* Example 3 */}
            <div style={exampleCard}>
              <Text style={exampleLabel}>Web Developer</Text>
              <Text style={exampleInput}>Input: "Freelance web developer for small businesses"</Text>
              <div style={exampleResultBox}>
                <Text style={exampleResultLabel}>✨ Generated Instagram Post:</Text>
                <Text style={exampleCaption}>
                  "Your website is your 24/7 salesperson. Is it working? 💼

                  Most small businesses lose customers because their website is slow, outdated, or just plain confusing. I fix that.

                  Fast, modern websites that actually convert visitors into customers. Let's talk about your goals."
                </Text>
                <Text style={exampleHashtags}>
                  #WebDeveloper #SmallBusiness #WebsiteDesign #FreelanceDeveloper
                </Text>
              </div>
            </div>

            <Hr style={divider} />

            <Text style={text}>
              <strong>All of these were created in under 60 seconds.</strong> No design skills. No writing experience. Just describe your business and let AI do the rest.
            </Text>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Text style={ctaText}>Ready to create yours?</Text>
            <Button style={button} href={quickStartUrl}>
              Try Quick Start Now →
            </Button>
            <Text style={subText}>Takes 30 seconds. No credit card required.</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Have questions? Just reply to this email — we read every message.
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

export default ExampleShowcaseEmail;

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

const exampleCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px',
};

const exampleLabel = {
  color: '#7C3AED',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
};

const exampleInput = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0 0 16px',
};

const exampleResultBox = {
  backgroundColor: '#ffffff',
  border: '2px solid #7C3AED',
  borderRadius: '6px',
  padding: '16px',
};

const exampleResultLabel = {
  color: '#7C3AED',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const exampleCaption = {
  color: '#1a1a1a',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px',
  whiteSpace: 'pre-line' as const,
};

const exampleHashtags = {
  color: '#7C3AED',
  fontSize: '14px',
  margin: '0',
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
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
