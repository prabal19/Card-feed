// src/app/cookies/page.tsx
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cookie } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-4xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
            <div className="mx-auto mb-4 flex items-center justify-center text-primary">
                <Cookie className="h-16 w-16" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">Cookie Policy</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              Last Updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-10 text-card-foreground prose max-w-none prose-headings:text-primary prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
            
            <p>This Cookie Policy explains how CardFeed ("we," "us," or "our") uses cookies and similar tracking technologies when you visit our website and use our Services. It explains what these technologies are and why we use them, as well as your rights to control our use of them.</p>

            <section>
              <h2 className="text-2xl font-semibold">1. What Are Cookies?</h2>
              <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>
              <p>Cookies set by the website owner (in this case, CardFeed) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">2. Why Do We Use Cookies?</h2>
              <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Services to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Services for advertising, analytics, and other purposes. This is described in more detail below.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">3. Types of Cookies We Use</h2>
              <p>The specific types of first and third-party cookies served through our Services and the purposes they perform are described below (please note that the specific cookies served may vary depending on the specific Online Properties you visit):</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Essential Website Cookies:</strong> These cookies are strictly necessary to provide you with services available through our Services and to use some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver the Services to you, you cannot refuse them without impacting how our Services function.</li>
                <li><strong>Performance and Functionality Cookies:</strong> These cookies are used to enhance the performance and functionality of our Services but are non-essential to their use. However, without these cookies, certain functionality (like remembering your login details or preferences) may become unavailable.</li>
                <li><strong>Analytics and Customization Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our Services are being used or how effective our marketing campaigns are, or to help us customize our Services for you.</li>
                <li><strong>Advertising Cookies:</strong> These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests. (Currently, CardFeed does not serve third-party advertising cookies but may do so in the future).</li>
                <li><strong>Social Media Cookies:</strong> These cookies are used to enable you to share pages and content that you find interesting on our Services through third-party social networking and other websites. These cookies may also be used for advertising purposes too. (For example, 'Login with Facebook/Google/Twitter' functionality).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">4. How Can You Control Cookies?</h2>
              <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by setting or amending your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.</p>
              <p>Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.</p>
              <p>Find out how to manage cookies on popular browsers:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><a href="https://support.google.com/accounts/answer/61416?co=GENIE.Platform%3DDesktop&hl=en" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                <li><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop?redirectslug=enable-and-disable-cookies-website-preferences&redirectlocale=en-US" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold">5. Other Tracking Technologies</h2>
              <p>In addition to cookies, we may use other similar technologies like web beacons (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files that contain a unique identifier that enable us to recognize when someone has visited our Services or opened an e-mail including them. This allows us, for example, to monitor the traffic patterns of users from one page within our Services to another, to deliver or communicate with cookies, to understand whether you have come to our Services from an online advertisement displayed on a third-party website, to improve site performance, and to measure the success of e-mail marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will impair their functioning.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">6. Changes to This Cookie Policy</h2>
              <p>We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">7. Contact Us</h2>
              <p>If you have any questions about our use of cookies or other technologies, please email us at: <a href="mailto:cookies@cardfeed.com">cookies@cardfeed.com</a> or via our <a href="/contact">contact page</a>.</p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
