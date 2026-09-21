// 마감일 표시 테스트가 시간대에 좌우되지 않게 한다.
process.env.TZ = 'UTC';

import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    css: false,
  },
});
