import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      PORT: 6009,
    },
    exclude: [...configDefaults.exclude],
    include: ['tests/vitest/specs/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['server/**/*.js', '!server/app.js', '!server/server.js'],
      thresholds: {
        lines: 18,
        functions: 10,
        branches: 5,
        statements: 18,
      },
    },
  },
})
