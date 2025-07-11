// src/components/blog/resources-sidebar.tsx
'use client';

import Link from 'next/link';
import {
  Info,
  Mail,
  HelpCircle,
  Scale,
  ShieldCheck,
  FileText,
  Cookie,
  AlertTriangle,
} from 'lucide-react';
import { Separator } from '../ui/separator';

const resourcesLinks = [
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dmca', label: 'DMCA Policy', icon: Scale },
  { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { href: '/terms', label: 'Terms of Service', icon: FileText },
  { href: '/cookies', label: 'Cookie Policy', icon: Cookie },
  { href: '/disclaimer', label: 'Disclaimer', icon: AlertTriangle },
];

export function ResourcesSidebar() {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">
          Resources
      </h3>
      <div>
        <ul className="space-y-1">
          {resourcesLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-3 p-2 -ml-2 rounded-none text-foreground hover:bg-accent transition-colors group"
              >
                <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium group-hover:text-primary">
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
