import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codex.quackquake',
  appName: 'Quack Quake',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
