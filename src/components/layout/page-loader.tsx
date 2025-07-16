// src/components/layout/page-loader.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // We use a combination of pathname and searchParams to detect route changes
    handleStop(); // Ensure loader is stopped on initial load

    return () => {
      handleStop(); // Ensure loader is stopped on unmount
    };
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // This is a client component that will be rendered on the server but
  // its effects will only run on the client.
  // The 'use client' directive is key here.
  // We attach listeners globally in the root layout's client boundary.
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
        const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
        const currentUrl = window.location.href;
        if (targetUrl !== currentUrl) {
            NProgress.start();
        }
    };

    const handleMutation: MutationCallback = () => {
        const anchorElements = document.querySelectorAll('a');
        anchorElements.forEach(anchor => anchor.addEventListener('click', handleAnchorClick));
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document, { childList: true, subtree: true });

        window.history.pushState = new Proxy(window.history.pushState, {
          apply: (target, thisArg, argArray: [any, string, string?]) => {
            NProgress.done();
            return target.apply(thisArg, argArray);
          },
        });


  });


  return null;
}
