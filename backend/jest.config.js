module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/config/swagger.ts'],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
