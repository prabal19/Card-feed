// components/ResourcesLinks.tsx
import Link from 'next/link';
import { Info, Mail, CircleHelp, ShieldAlert } from 'lucide-react';

export function ResourcesLinks() {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-4 tracking-wide">
        Resources
      </h2>
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          <Link href="/about" className="hover:underline">About Us</Link>
        </li>
        <li className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <Link href="/contact" className="hover:underline">Contact</Link>
        </li>
        <li className="flex items-center gap-2">
          <CircleHelp className="w-5 h-5" />
          <Link href="/faq" className="hover:underline">FAQ</Link>
        </li>
        <li className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          <Link href="/dmca" className="hover:underline">DMCA Policy</Link>
        </li>
      </ul>
    </div>
  );
}
