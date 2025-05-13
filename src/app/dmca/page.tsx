// src/app/dmca/page.tsx
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scale } from 'lucide-react'; // Using Scale icon for legal/DMCA context

export default function DmcaPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-4xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
            <div className="mx-auto mb-4 flex items-center justify-center text-primary">
                <Scale className="h-16 w-16" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">DMCA Policy</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              Digital Millennium Copyright Act Notice
              <br />
              Last Updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-10 text-card-foreground prose max-w-none prose-headings:text-primary prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
            
            <p>CardFeed ("we," "us," or "our") respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 (the "DMCA"), the text of which may be found on the U.S. Copyright Office website at <a href="http://www.copyright.gov/legislation/dmca.pdf" target="_blank" rel="noopener noreferrer">http://www.copyright.gov/legislation/dmca.pdf</a>, CardFeed will respond expeditiously to claims of copyright infringement committed using the CardFeed service and/or the CardFeed website (the "Site") if such claims are reported to CardFeed's Designated Copyright Agent identified in the sample notice below.</p>

            <section>
              <h2 className="text-2xl font-semibold">1. Notification of Copyright Infringement</h2>
              <p>If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to CardFeed's Designated Copyright Agent. Upon receipt of the Notice as described below, CardFeed will take whatever action, in its sole discretion, it deems appropriate, including removal of the challenged material from the Site.</p>
              <p>To file a DMCA Notice of Alleged Infringement, you must provide the following information in writing (see 17 U.S.C § 512(c)(3) for further detail):</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
                <li>Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works at a single online site are covered by a single notification, a representative list of such works at that site.</li>
                <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit the service provider to locate the material. Providing URLs in the body of an email is the best way to help us locate content quickly.</li>
                <li>Information reasonably sufficient to permit the service provider to contact you, such as an address, telephone number, and, if available, an electronic mail address at which you may be contacted.</li>
                <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
                <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
              </ul>
              <p>Deliver this Notice, with all items completed, to CardFeed's Designated Copyright Agent:</p>
              <p>
                Copyright Agent<br />
                CardFeed Legal Department<br />
                123 CardFeed Street, Innovation City, CF 12345<br />
                Email: <a href="mailto:dmca@cardfeed.com">dmca@cardfeed.com</a>
              </p>
              <p>Please note that you may be liable for damages (including costs and attorneys' fees) if you materially misrepresent that a product or activity is infringing your copyrights.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">2. Counter-Notification Procedures</h2>
              <p>If you believe that material you posted on the site was removed or access to it was disabled by mistake or misidentification, you may file a counter-notification with us (a "Counter-Notice") by submitting written notification to our copyright agent (identified below). Pursuant to the DMCA, the Counter-Notice must include substantially the following:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your physical or electronic signature.</li>
                <li>An identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or access disabled.</li>
                <li>A statement under penalty of perjury by you that you have a good faith belief that the material was removed or disabled as a result of a mistake or misidentification of the material to be removed or disabled.</li>
                <li>Your name, address, telephone number, and, if available, e-mail address and a statement that you consent to the jurisdiction of the Federal Court for the judicial district in which your address is located (or if your address is outside the United States, for any judicial district in which CardFeed may be found) and that you will accept service of process from the person who provided notification of the alleged infringement.</li>
              </ul>
              <p>Deliver this Counter-Notice, with all items completed, to CardFeed's Designated Copyright Agent at the contact information provided above.</p>
              <p>The DMCA allows us to restore the removed content if the party filing the original DMCA Notice does not file a court action against you within ten business days of receiving the copy of your Counter-Notice.</p>
              <p>Please be advised that U.S. copyright law provides substantial penalties for a false counter-notice filed in response to a notice of copyright infringement.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">3. Repeat Infringers</h2>
              <p>In accordance with the DMCA and other applicable law, CardFeed has adopted a policy of terminating, in appropriate circumstances and at CardFeed's sole discretion, users who are deemed to be repeat infringers. CardFeed may also at its sole discretion limit access to the Site and/or terminate the accounts of any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold">4. Contact Us</h2>
              <p>If you have any questions about this DMCA Policy, please contact our Copyright Agent at <a href="mailto:dmca@cardfeed.com">dmca@cardfeed.com</a> or via our <a href="/contact">contact page</a>.</p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
