// ESLint flat config — TODO.md §1.2/§1.4 katman kuralları ve §1.9 boyut sınırları.
// Katman kuralları "beyaz liste"dir: aşağıda izin verilmeyen her iç import hata verir.
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const boundaries = require('eslint-plugin-boundaries');

// İhlal örnekleri docs/lint-violations/ altında gerçek yapının aynısıyla durur (T0.2 doğrulaması).
const VIOLATIONS = 'docs/lint-violations';
const el = (type, pattern, capture) => ({
  type,
  pattern: [pattern, `${VIOLATIONS}/${pattern}`],
  partialMatch: false,
  ...(capture ? { capture } : {}),
});
const FN = 'supabase/functions';

const elements = [
  // Frontend
  el('route', 'app'),
  el('screen', 'src/features/*/screens', ['feature']),
  el('feature-component', 'src/features/*/components', ['feature']),
  el('hook', 'src/features/*/hooks', ['feature']),
  el('feature-service', 'src/features/*/services', ['feature']),
  el('ui', 'src/components/ui'),
  el('service', 'src/services'),
  el('domain', 'src/domain'),
  el('repository', 'src/data/repositories'),
  el('db', 'src/data/db'),
  el('api', 'src/data/api'),
  el('supabase-client', 'src/data/supabase'),
  el('lib', 'src/lib'),
  el('theme', 'src/theme'),
  el('i18n', 'src/i18n'),
  el('test-utils', 'src/test-utils'),
  // Backend (Edge Functions)
  el('shared', `${FN}/_shared`),
  el('fn-route', `${FN}/*/routes`, ['fn']),
  el('fn-service', `${FN}/*/services`, ['fn']),
  el('fn-repository', `${FN}/*/repositories`, ['fn']),
  el('fn-provider', `${FN}/*/providers`, ['fn']),
  el('fn-test', `${FN}/*/tests`, ['fn']),
  el('fn-entry', `${FN}/*`, ['fn']),
];

const is = (type, extra = {}) => ({ element: { type, ...extra } });
const to = (...selectors) => ({ to: selectors });
const sameFeature = { captured: { feature: '{{ from.element.captured.feature }}' } };
const sameFn = { captured: { fn: '{{ from.element.captured.fn }}' } };
const shared = (...paths) => is('shared', { fileInternalPath: paths });

const policies = [
  // Frontend (§1.2)
  {
    // Rota yalnızca Screen render eder. İstisna (T0.7): _layout dosyaları hata ekranını ve
    // hata izlemeyi bağlar.
    from: is('route'),
    allow: to(
      is('screen'),
      is('ui', { fileInternalPath: 'ErrorBoundary/**' }),
      is('lib', { fileInternalPath: 'observability/**' }),
    ),
  },
  {
    from: is('screen'),
    allow: to(
      is('feature-component', sameFeature),
      is('hook', sameFeature),
      is('ui'),
      is('theme'),
      is('i18n'),
    ),
  },
  {
    from: is('feature-component'),
    allow: to(
      is('feature-component', sameFeature),
      is('ui'),
      is('theme'),
      is('i18n'),
      is('lib', { fileInternalPath: 'format.ts' }),
    ),
  },
  {
    from: is('ui'),
    allow: to(is('ui'), is('theme'), is('i18n'), is('lib', { fileInternalPath: 'format.ts' })),
  },
  {
    from: is('hook'),
    allow: to(
      is('hook', sameFeature),
      is('feature-service', sameFeature),
      is('service'),
      is('domain'),
    ),
  },
  {
    from: is('feature-service'),
    allow: to(
      is('feature-service', sameFeature),
      is('service'),
      is('domain'),
      is('repository'),
      is('api'),
      is('lib'),
    ),
  },
  {
    from: is('service'),
    allow: to(is('service'), is('domain'), is('repository'), is('api'), is('lib')),
  },
  { from: is('domain'), allow: to(is('domain'), is('lib')) },
  { from: is('repository'), allow: to(is('repository'), is('db'), is('domain')) },
  { from: is('db'), allow: to(is('db'), is('domain')) },
  { from: is('api'), allow: to(is('api'), is('supabase-client'), is('domain')) },
  { from: is('supabase-client'), allow: to(is('lib')) },
  { from: is('lib'), allow: to(is('lib')) },
  { from: is('theme'), allow: to(is('theme')) },
  { from: is('i18n'), allow: to(is('i18n')) },

  // Backend (§1.4)
  { from: is('fn-entry'), allow: to(is('fn-route', sameFn), shared('http/**')) },
  {
    from: is('fn-route'),
    allow: to(
      is('fn-service', sameFn),
      shared('http/**', 'auth/**', 'validation/**', 'observability/**'),
    ),
  },
  {
    from: is('fn-service'),
    allow: to(
      is('fn-service', sameFn),
      is('fn-repository', sameFn),
      is('fn-provider', sameFn),
      shared('domain/**', 'clock.ts', 'observability/**'),
    ),
  },
  { from: is('fn-repository'), allow: to(shared('db/**')) },
  { from: is('fn-provider'), allow: to(shared('http-client/**', 'config.ts')) },
  { from: is('shared'), allow: to(is('shared')) },
];

// §1.9 boyut sınırları (boş satır ve yorumlar sayılmaz)
const maxLines = (files, max) => ({
  files: [...files, ...files.map((f) => `${VIOLATIONS}/${f}`)],
  ignores: ['**/*.test.ts', '**/*.test.tsx'],
  rules: { 'max-lines': ['error', { max, skipBlankLines: true, skipComments: true }] },
});

module.exports = defineConfig([
  globalIgnores([
    'node_modules/',
    '.expo/',
    'dist/',
    'coverage/',
    'ios/',
    'android/',
    'expo-env.d.ts',
    `${VIOLATIONS}/`,
  ]),
  expoConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: true,
      },
      'boundaries/include': ['app/**', 'src/**', `${FN}/**`, `${VIOLATIONS}/**`],
      'boundaries/elements': elements,
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', policies }],
    },
  },
  {
    // Testler ve test yardımcıları katmanları serbestçe import edebilir
    files: ['**/*.test.{ts,tsx}', 'src/test-utils/**', `${FN}/*/tests/**`],
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    // src/domain saf kalır: UI, platform veya veri katmanı paketi yok
    files: ['src/domain/**', `${VIOLATIONS}/src/domain/**`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-native',
                'react-native/*',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                '@sentry/*',
                '@/lib/observability/*',
              ],
              message:
                'src/domain saf kalmalı: React, React Native, Expo ve hata izleme import edilemez.',
            },
          ],
        },
      ],
    },
  },
  {
    // Edge Function'lar Deno'da çalışır; paketler deno.json'dan (npm:/jsr:) çözülür, Node çözücüsü
    // bunları bulamaz ya da yanlış sürümü okur. Paket kontrolünü Deno'nun tip denetimi yapar.
    files: [`${FN}/**`, `${VIOLATIONS}/${FN}/**`],
    rules: {
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/named': 'off',
      'import/default': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
    },
  },
  maxLines(['app/**/*.tsx'], 30),
  maxLines([`${FN}/*/index.ts`], 25),
  maxLines([`${FN}/*/routes/*.route.ts`], 80),
  maxLines(
    [
      'src/features/*/screens/**/*.tsx',
      'src/features/*/components/**/*.tsx',
      'src/components/ui/**/*.tsx',
    ],
    150,
  ),
  maxLines(
    [
      'src/features/*/hooks/**/*.ts',
      'src/features/*/services/**/*.ts',
      'src/services/**/*.ts',
      `${FN}/*/services/**/*.ts`,
    ],
    250,
  ),
  prettierConfig,
]);
