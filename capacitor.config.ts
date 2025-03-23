import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shiguang.app',
  appName: '时光',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  },
  android: {
    // Android特有设置
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff', // 设置为应用主背景色
      overlaysWebView: true
    }
  }
};

export default config;
