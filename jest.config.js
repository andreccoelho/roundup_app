/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/src/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    // tsconfig.json usa module/moduleResolution voltados pro bundler do Expo (Metro),
    // incompatíveis com o require() do Node que o ts-jest precisa gerar
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
