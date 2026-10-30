/**
 * 3mmar Store - Dynamic API Host Resolver
 * Automatically resolves the backend URL whether running on:
 * - Firebase Hosting (mmar-store.web.app / firebaseapp.com)
 * - Cloudflare Tunnel (trycloudflare.com)
 * - Local PC Browser (localhost:5000)
 * - Android Studio Emulator (10.0.2.2:5000)
 * - Real Android Device via LAN (192.168.x.x:5000)
 * - Embedded Android WebView
 */

// Active High-Speed Cloudflare Global Edge Tunnel URL for Live Backend
export const LIVE_BACKEND_TUNNEL_URL = 'https://civic-sri-great-alternatives.trycloudflare.com';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // 1. If loaded from Firebase Hosting or external public hosting (e.g. mobile user on 4G/Wi-Fi)
    if (hostname.includes('web.app') || hostname.includes('firebaseapp.com') || hostname.includes('github.io')) {
      return `${LIVE_BACKEND_TUNNEL_URL}/api`;
    }

    // 2. If loaded directly through the Cloudflare Tunnel URL
    if (hostname.includes('trycloudflare.com')) {
      return '/api';
    }

    // 3. Android Studio Emulator standard host alias
    if (hostname === '10.0.2.2') {
      return 'http://10.0.2.2:5000/api';
    }

    // 4. Local network IP address (e.g. physical Android phone on same Wi-Fi)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:5000/api`;
    }

    // 5. Android WebView file:/// protocol fallback
    const ua = (window.navigator.userAgent || '').toLowerCase();
    if (ua.includes('android') && (!hostname || hostname === 'localhost')) {
      return `${LIVE_BACKEND_TUNNEL_URL}/api`;
    }
  }

  // 6. Default PC Localhost
  return 'http://localhost:5000/api';
}
