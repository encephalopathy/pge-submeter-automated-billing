const config = {
    preset: 'ts-jest',
    rootDir: '.',
    verbose: true,           // Display individual test results
    clearMocks: true,        // Automatically clear mocks between tests
    testEnvironment: 'node', // Use 'jsdom' for browser-like testing
    testMatch: [
        '<rootDir>/tests/*.test.ts'
    ],
  };
  
  module.exports = config;