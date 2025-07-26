
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for BrandForge AI. Understand how we collect, use, and protect your data.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
        <CardDescription>Last Updated: {new Date().toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline">
        
        <h2>1. Introduction</h2>
        <p>
            Welcome to BrandForge AI ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
        </p>

        <h2>2. Information We Collect</h2>
        <p>We may collect information about you in a variety of ways. The information we may collect includes:</p>
        <ul>
            <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your name and email address, that you voluntarily give to us when you register with the application.
            </li>
            <li>
                <strong>Brand Data:</strong> Information you provide to build your brand profile, including but not limited to your brand name, description, target keywords, website URLs, and any example images you upload. This information is used to power the AI generation features.
            </li>
            <li>
                <strong>Generated Content:</strong> We store the content generated for you through our service—including images, social media posts, blog articles, and ad campaigns—to make it accessible to you within the application's Deployment Hub and Image Library.
            </li>
            <li>
                <strong>Usage Data:</strong> We collect data on your use of the service, such as the number of images, social posts, and blog articles you generate, to manage your plan's quotas.
            </li>
             <li>
                <strong>Technical Data:</strong> Information our servers automatically collect when you access the application, such as your IP address, browser type, operating system, and access times.
            </li>
        </ul>

        <h2>3. Use of Your Information</h2>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:</p>
        <ul>
            <li>Create and manage your account and subscription plan.</li>
            <li>Provide the core functionality of the app, which involves passing your Brand Data to third-party AI models (e.g., Google AI's Gemini and Imagen) to generate content tailored to your brand.</li>
            <li>Operate, maintain, and improve our application and services.</li>
            <li>Monitor and analyze usage and trends to improve your experience.</li>
            <li>Process payments and prevent fraudulent transactions.</li>
            <li>Notify you of updates to the application.</li>
        </ul>

        <h2>4. Disclosure of Your Information</h2>
        <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
        <ul>
            <li>
                <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.
            </li>
            <li>
                <strong>Third-Party Service Providers:</strong> We share your brand information and prompts with our AI model providers (e.g., Google AI) to generate content. We use Firebase for backend services including database (Firestore), file storage (Cloud Storage), and authentication. For payments, we use Razorpay to process transactions securely. We do not control how these third parties use the information required to provide their service, and we encourage you to review their respective privacy policies.
            </li>
        </ul>
        
        <h2>5. Security of Your Information</h2>
        <p>
            We use administrative, technical, and physical security measures, powered by Google Cloud and Firebase, to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>

        <h2>6. Policy for Children</h2>
        <p>
            We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
        </p>

        <h2>7. Contact Us</h2>
        <p>
            If you have questions or comments about this Privacy Policy, please contact us at: support@brandforge.ai
        </p>
      </CardContent>
    </Card>
  );
}
