import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.potal.app',
  appName: 'POTAL',
  webDir: 'out',
  server: {
    // 라이브 서버를 WebView로 로드 (API routes + SSR 유지)
    url: 'https://potal.app',
    cleartext: false,
    // potal.app 내 모든 네비게이션을 앱 내 WebView에서 처리 (Safari로 안 넘어감)
    allowNavigation: ['potal.app', '*.potal.app'],
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'POTAL',
    backgroundColor: '#02122c',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: '#02122c',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#02122c',
    },
  },
};

export default config;
