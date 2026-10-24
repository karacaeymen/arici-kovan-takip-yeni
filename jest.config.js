// Jest iki proje olarak çalışır (TODO.md T0.3):
//  - unit: saf Node ortamı → src/domain, src/lib, servisler, repository'ler, API istemcileri
//  - ui:   jest-expo + React Native Testing Library → bileşenler, Screen'ler, hook'lar
// babel-preset-expo, expo paketinin içinden çözülür (kökte ayrı kurulu değil)
const babelPresetExpo = require.resolve('babel-preset-expo', {
  paths: [require.resolve('expo/package.json')],
});

const moduleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' };

const UNIT_TESTS = [
  '<rootDir>/src/domain/**/*.test.ts',
  '<rootDir>/src/lib/**/*.test.ts',
  '<rootDir>/src/services/**/*.test.ts',
  '<rootDir>/src/features/*/services/**/*.test.ts',
  '<rootDir>/src/data/**/*.test.ts',
];

// Henüz dosyası olmayan klasör için eşik konmaz; yoksa Jest "kapsam verisi bulunamadı" hatası verir.
function coverageThresholds() {
  const { globSync } = require('node:fs');
  const rules = {
    './src/domain/': 90,
    './src/services/': 80,
    './src/features/*/services/': 80,
  };
  const thresholds = {};
  for (const [dir, lines] of Object.entries(rules)) {
    const sources = globSync(`${dir}**/*.{ts,tsx}`).filter((f) => !/\.test\.tsx?$/.test(f));
    if (sources.length > 0) thresholds[dir] = { lines };
  }
  return thresholds;
}

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: UNIT_TESTS,
      moduleNameMapper,
      transform: {
        '\\.[jt]sx?$': [
          'babel-jest',
          { presets: [babelPresetExpo], babelrc: false, configFile: false },
        ],
      },
    },
    {
      displayName: 'ui',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/features/*/hooks/**/*.test.ts'],
      moduleNameMapper,
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-utils/**',
    '!src/**/index.ts',
  ],
  // Eşik altında `npm run test:coverage` hata verir (domain ≥ %90, servisler ≥ %80 satır).
  coverageThreshold: coverageThresholds(),
};
