'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (analytics) {
      // ページビューイベントを送信
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

      logEvent(analytics, 'page_view', {
        page_path: url,
        page_title: document.title,
        page_location: window.location.href,
      });

      console.log('📊 Google Analytics: Page view tracked', url);
    }
  }, [pathname, searchParams]);

  return null;
}
