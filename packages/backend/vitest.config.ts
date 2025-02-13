import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        reporters: ['default'],
        watch: !process.env.CI,
    },
})
