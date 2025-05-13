import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="bg-card border-t text-card-foreground">
      <div className="container mx-auto px-8 py-6 md:py-8"> {/* Adjusted padding */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/90 transition-colors mb-2">
              <Newspaper className="h-6 w-6" />
              <span>CardFeed</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your daily dose of inspiring blogs and trending topics.
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-2 text-foreground">Quick Links</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/dmca" className="text-muted-foreground hover:text-primary transition-colors">DMCA Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-2 text-foreground">Legal</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link href="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CardFeed. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
