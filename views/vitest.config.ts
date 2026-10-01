import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    root: '.',
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'fixtures/**/*.test.ts'],
    exclude: ['e2e/**', 'dist/**', 'node_modules/**'],
    env: { TZ: 'Asia/Tokyo' },
  },
});
