export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  // Mock jose module completely to avoid ES module issues
  moduleNameMapper: {
    "^jose$": "<rootDir>/src/__mocks__/jose.ts",
    // Map .js extensions to .ts for Jest module resolution
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
