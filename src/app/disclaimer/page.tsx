// src/app/disclaimer/page.tsx
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react'; // Using AlertTriangle for disclaimer context

export default function DisclaimerPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-4xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
            <div className="mx-auto mb-4 flex items-center justify-center text-primary">
                <AlertTriangle className="h-16 w-16" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">Disclaimer</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              Last Updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-10 text-card-foreground prose max-w-none prose-headings:text-primary prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
            
            <p>The information provided by CardFeed ("we," "us," or "our") on our website (the "Service") is for general informational purposes only. All information on the Service is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Service.</p>

            <section>
              <h2 className="text-2xl font-semibold">1. User-Generated Content</h2>
              <p>The Service allows users to create, post, and share content, including articles, comments, and other materials ("User Content"). The views and opinions expressed in User Content belong solely to the original authors and do not necessarily reflect the views and opinions of CardFeed. We are not responsible for any User Content posted on the Service.</p>
              <p>CardFeed does not pre-screen User Content but reserves the right (but not the obligation) in our sole discretion to refuse or remove any User Content that, in our reasonable opinion, violates any CardFeed policies or is in any way harmful or objectionable.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">2. External Links Disclaimer</h2>
              <p>The Service may contain (or you may be sent through the Service) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.</p>
              <p>WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR THE ACCURACY OR RELIABILITY OF ANY INFORMATION OFFERED BY THIRD-PARTY WEBSITES LINKED THROUGH THE SITE OR ANY WEBSITE OR FEATURE LINKED IN ANY BANNER OR OTHER ADVERTISING. WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">3. No Professional Advice</h2>
              <p>The information on the Service is provided for general informational and educational purposes only and is not a substitute for professional advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals. We do not provide any kind of professional advice (e.g., financial, legal, medical, health, etc.).</p>
              <p>THE USE OR RELIANCE OF ANY INFORMATION CONTAINED ON THIS SITE IS SOLELY AT YOUR OWN RISK.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">4. Errors and Omissions Disclaimer</h2>
              <p>While we have made every attempt to ensure that the information contained in this site has been obtained from reliable sources, CardFeed is not responsible for any errors or omissions or for the results obtained from the use of this information. All information in this site is provided "as is", with no guarantee of completeness, accuracy, timeliness or of the results obtained from the use of this information, and without warranty of any kind, express or implied, including, but not limited to warranties of performance, merchantability, and fitness for a particular purpose.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">5. Views Expressed Disclaimer</h2>
              <p>The views and opinions expressed on the Service are those of the authors and do not necessarily reflect the official policy or position of any other agency, organization, employer, or company, including CardFeed. Comments published by users are their sole responsibility and the users will take full responsibility, liability, and blame for any libel or litigation that results from something written in or as a direct result of something written in a comment.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
              <p>In no event will CardFeed, or its partners, employees, or agents, be liable to you or anyone else for any decision made or action taken in reliance on the information in this Service or for any consequential, special or similar damages, even if advised of the possibility of such damages.</p>
            </section>

             <section>
              <h2 className="text-2xl font-semibold">7. Reservation of Rights</h2>
              <p>We reserve the right to amend or update this disclaimer at any time without notice. By using this Service, you agree to be bound by the current version of this disclaimer.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">8. Contact Us</h2>
              <p>If you have any questions about this Disclaimer, please contact us via our <a href="/contact">contact page</a>.</p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
