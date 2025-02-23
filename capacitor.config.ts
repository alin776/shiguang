import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shiguang.app',
  appName: '时光',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
