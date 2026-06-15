import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soujinne.hanjaexplorer',
  appName: '한자팝',
  webDir: '../frontend/dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Google Cloud Console > OAuth 2.0 > 웹 애플리케이션 클라이언트 ID
      serverClientId: '1050279254864-1hgfqf17ve0sc2nlit7kojuace89mond.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
