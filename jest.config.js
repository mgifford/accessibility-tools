/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass|svg|png|jpg|jpeg|gif|webp)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js'
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/electron/lib/utils.js',
    'src/stores/**/*.js',
    'src/constants/**/*.js',
    'src/hooks/**/*.js',
    '!src/**/__tests__/**'
  ]
};
