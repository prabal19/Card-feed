import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppFooter } from '@/components/layout/footer';
import { AuthProvider } from '@/contexts/auth-context'; // Added AuthProvider
import { PageLoader } from '@/components/layout/page-loader';
import { Suspense } from 'react';

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
    openGraph: {
    title: 'CardFeed',
    description: 'Discover, read, and get inspired with CardFeed.',
    url: 'https://card-feed.vercel.app/', // Replace with your actual domain
    siteName: 'CardFeed',
    images: [
      {
        url: '/card.jpg', // A generic social share image
        width: 1200,
        height: 630,
        alt: 'CardFeed Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CardFeed',
    description: 'Discover, read, and get inspired with CardFeed.',
    images: ['/card.jpg'], // A generic social share image
  },
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
          <Suspense fallback={null}>
            <PageLoader />
          </Suspense>
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
