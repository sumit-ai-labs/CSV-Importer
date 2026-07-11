/**
 * jest.config.ts — Backend test runner configuration
 *
 * Uses ts-jest with ESM support for Node.js + TypeScript testing.
 * Compatible with the project's "type": "module" setup via tsx/ts-jest.
 */

import type { Config } from 'jest';

const config: Config = {
  displayName: 'backend',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Strip .js extension added by ESM imports in TypeScript source
    '^(\\.\\.?/.+)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          // Ensure ts-jest can resolve ESM modules
          module: 'ESNext',
          moduleResolution: 'node',
          strict: true,
        },
      },
    ],
  },
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/*.test.ts', '!**/server.ts'],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: [],
  testTimeout: 15000,
};

export default config;
