'use client';

// Registers the Coach PWA service worker. No-op in the Tauri desktop webview.
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Skip inside the Tauri desktop app.
    if ((window as any).__TAURI__ || (window as any).__TAURI_INTERNALS__) return;

    // Inject the manifest + theme-color so /coach is installable, without
    // touching the global desktop layout.
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.webmanifest';
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#0d0e12';
      document.head.appendChild(meta);
    }
    let apple = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!apple) {
      apple = document.createElement('meta');
      apple.setAttribute('name', 'apple-mobile-web-app-capable');
      apple.setAttribute('content', 'yes');
      document.head.appendChild(apple);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
