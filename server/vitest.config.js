import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.{js,cjs}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['controllers/**', 'middlewares/**', 'routes/**', 'utils/**', 'app.js'],
    },
  },
});
