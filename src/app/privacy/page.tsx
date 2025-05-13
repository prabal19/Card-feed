// src/app/privacy/page.tsx
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-4xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
             <div className="mx-auto mb-4 flex items-center justify-center text-primary">
                <ShieldCheck className="h-16 w-16" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">Privacy Policy</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              Last Updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-10 text-card-foreground prose max-w-none prose-headings:text-primary prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
            
            <p>Welcome to CardFeed! Your privacy is critically important to us. This Privacy Policy outlines how CardFeed ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our website and services (collectively, the "Services").</p>

            <section>
              <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
              <p>We may collect several types of information from and about users of our Services, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Personal Information You Provide:</strong> This includes information you provide when you register for an account (e.g., name, email address, password), create content (e.g., posts, comments), or communicate with us.</li>
                <li><strong>Usage Information:</strong> When you access or use our Services, we may automatically collect information about your usage, such as your IP address, browser type, operating system, pages viewed, links clicked, and the dates and times of your visits.</li>
                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track activity on our Services and hold certain information. For more details, please see our <a href="/cookies">Cookie Policy</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
              <p>We use the information we collect for various purposes, including to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide, operate, and maintain our Services.</li>
                <li>Improve, personalize, and expand our Services.</li>
                <li>Understand and analyze how you use our Services.</li>
                <li>Develop new products, services, features, and functionality.</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes (with your consent, where required).</li>
                <li>Process your transactions and manage your orders.</li>
                <li>Find and prevent fraud.</li>
                <li>Comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">3. How We Share Your Information</h2>
              <p>We may share your personal information in the following situations:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>With Service Providers:</strong> We may share your information with third-party vendors and service providers that perform services on our behalf, such as hosting, data analysis, payment processing, and customer service.</li>
                <li><strong>For Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                <li><strong>With Affiliates:</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy.</li>
                <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
                <li><strong>For Legal Reasons:</strong> We may disclose your information if we believe it's necessary to comply with a legal obligation, protect our rights or property, prevent fraud, or protect the safety of our users or the public.</li>
              </ul>
               <p>Your public content, such as posts and comments, along with your profile name and image, will be visible to other users of the Services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">4. Data Security</h2>
              <p>We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure. However, no internet or email transmission is ever fully secure or error-free, so you should take special care in deciding what information you send to us.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">5. Your Data Protection Rights</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, delete, or restrict its processing. To exercise these rights, please contact us using the details provided below.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold">6. Children's Privacy</h2>
              <p>Our Services are not intended for children under the age of 13 (or a higher age threshold where applicable under local law). We do not knowingly collect personal information from children. If we learn that we have collected personal information from a child without parental consent, we will take steps to delete that information.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">7. Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">8. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@cardfeed.com">privacy@cardfeed.com</a> or via our <a href="/contact">contact page</a>.</p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
