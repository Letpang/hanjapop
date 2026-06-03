import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soujinne.hanjaexplorer',
  appName: '한자팝',
  webDir: '../frontend/dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Google Cloud Console > OAuth 2.0 > 웹 애플리케이션 클라이언트 ID
      serverClientId: 'REPLACE_WITH_YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
