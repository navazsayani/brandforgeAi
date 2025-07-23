
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
        
        <h2 className="my-4">1. Introduction</h2>
        <p className="my-4">
            Welcome to BrandForge AI (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
        </p>

        <h2 className="my-4">2. Information We Collect</h2>
        <p className="my-4">We may collect information about you in a variety of ways. The information we may collect includes:</p>
        <ul>
            <li className="my-2">
                <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the application.
            </li>
            <li className="my-2">
                <strong>Brand Data:</strong> Information you provide about your brand, including but not limited to brand name, description, target keywords, website URLs, and example images you upload.
            </li>
            <li className="my-2">
                <strong>Generated Content:</strong> We store the content generated for you through our service, including images, social media posts, blog articles, and ad campaigns, to make it accessible to you within the app.
            </li>
             <li className="my-2">
                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the application.
            </li>
        </ul>

        <h2 className="my-4">3. Use of Your Information</h2>
        <p className="my-4">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:</p>
        <ul>
            <li className="my-2">Create and manage your account.</li>
            <li className="my-2">Provide the core functionality of the app, including passing your brand data to third-party AI models (e.g., Google AI&apos;s Gemini) to generate content.</li>
            <li className="my-2">Improve our application and services.</li>
            <li className="my-2">Monitor and analyze usage and trends to improve your experience.</li>
            <li className="my-2">Notify you of updates to the application.</li>
        </ul>

        <h2 className="my-4">4. Disclosure of Your Information</h2>
        <p className="my-4">We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
        <ul>
            <li className="my-2">
                <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.
            </li>
            <li className="my-2">
                <strong>Third-Party Service Providers:</strong> We share your brand information and prompts with our third-party AI model providers (e.g., Google AI) to generate content. We do not control how these third parties use this information. We encourage you to review their privacy policies.
            </li>
            <li className="my-2">
                <strong>[Other third parties, e.g., analytics, cloud hosting]:</strong> You must list any other services you use that may have access to user data.
            </li>
        </ul>
        
        <h2 className="my-4">5. Security of Your Information</h2>
        <p className="my-4">
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>

        <h2 className="my-4">6. Policy for Children</h2>
        <p className="my-4">
            We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
        </p>

        <h2 className="my-4">7. Contact Us</h2>
        <p className="my-4">
            If you have questions or comments about this Privacy Policy, please contact us at: [Your Contact Email Address]
        </p>
      </CardContent>
    </Card>
  );
}
