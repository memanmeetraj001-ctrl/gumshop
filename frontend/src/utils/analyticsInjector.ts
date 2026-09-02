import { api } from '../api/client';
import { SiteSettings } from '../types';

let isInitialized = false;

/**
 * Initialize Google Analytics (GA4), Google Search Console, and Tracking Pixels dynamically
 */
export function initAnalyticsAndSEO(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  api
    .getSettings()
    .then((settings: SiteSettings) => {
      applyAnalyticsAndSEOSettings(settings);
    })
    .catch(() => {});
}

export function applyAnalyticsAndSEOSettings(settings: Partial<SiteSettings>): void {
  if (typeof document === 'undefined') return;

  // 1. Google Search Console Verification Meta Tag
  if (settings.googleSearchConsoleTag) {
    let verificationCode = settings.googleSearchConsoleTag.trim();
    // If user pasted full meta tag: <meta name="google-site-verification" content="XYZ" />
    if (verificationCode.includes('content=')) {
      const match = verificationCode.match(/content=["']([^"']+)["']/);
      if (match && match[1]) {
        verificationCode = match[1];
      }
    }

    let metaTag = document.querySelector('meta[name="google-site-verification"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'google-site-verification');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', verificationCode);
  }

  // 2. Google Analytics (GA4) Script Injection
  if (settings.googleAnalyticsId && settings.googleAnalyticsId.trim()) {
    const gaId = settings.googleAnalyticsId.trim();

    // Check if gtag script is already added
    if (!document.getElementById('ga-gtag-script')) {
      const script = document.createElement('script');
      script.id = 'ga-gtag-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.id = 'ga-gtag-init';
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}', { page_path: window.location.pathname });
      `;
      document.head.appendChild(inlineScript);
    }
  }

  // 3. Meta / Facebook Pixel
  if (settings.metaPixelId && settings.metaPixelId.trim()) {
    const pixelId = settings.metaPixelId.trim();
    if (!document.getElementById('meta-pixel-script')) {
      const pixelScript = document.createElement('script');
      pixelScript.id = 'meta-pixel-script';
      pixelScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(pixelScript);
    }
  }

  // 4. Custom Header Tracking Script
  if (settings.customHeaderScript && settings.customHeaderScript.trim()) {
    if (!document.getElementById('custom-header-tracking-script')) {
      const container = document.createElement('div');
      container.id = 'custom-header-tracking-script';
      container.innerHTML = settings.customHeaderScript;
      document.head.appendChild(container);
    }
  }
}
