import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
    define: {
        URL_PREFIX: JSON.stringify(''),
        VERSION: JSON.stringify('TEST'),
    },
});
