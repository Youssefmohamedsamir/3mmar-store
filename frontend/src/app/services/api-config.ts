/**
 * 3mmar Store - Dynamic API Host Resolver
 * Automatically resolves the backend URL whether running on:
 * - Local PC Browser (localhost:5000)
 * - Android Studio Emulator (10.0.2.2:5000)
 * - Real Android Device via LAN (192.168.x.x:5000)
 * - Embedded Android WebView
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // 1. Android Studio Emulator standard host alias
    if (hostname === '10.0.2.2') {
      return 'http://10.0.2.2:5000/api';
    }

    // 2. Local network IP address (e.g. testing on physical Android device connected to Wi-Fi)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('github.io')) {
      return `http://${hostname}:5000/api`;
    }

    // 3. Android WebView file:/// protocol fallback
    const ua = (window.navigator.userAgent || '').toLowerCase();
    if (ua.includes('android') && (!hostname || hostname === 'localhost')) {
      return 'http://10.0.2.2:5000/api';
    }
  }

  // 4. Default PC Web
  return 'http://localhost:5000/api';
}
