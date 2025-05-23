import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppFooter } from '@/components/layout/footer';
import { AuthProvider } from '@/contexts/auth-context'; // Added AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CardFeed - Your Daily Dose of Blogs',
  description: 'Discover, read, and get inspired with CardFeed.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <AuthProvider> 
          <div className="flex-grow">
            {children}
          </div>
          <AppFooter />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
