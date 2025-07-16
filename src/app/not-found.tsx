'use client';

import { Suspense } from 'react';
import { PageLoader } from '@/components/layout/page-loader';

export default function Custom404() {
  return (
    <Suspense fallback={null}>
      <PageLoader />
      <div className="text-center pt-20">
        <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
        <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
      </div>
    </Suspense>
  );
}
