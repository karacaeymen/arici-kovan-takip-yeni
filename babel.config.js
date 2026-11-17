// Drizzle'ın ürettiği `.sql` migration dosyaları paketin içine metin olarak gömülür (TODO.md T1.4).
// babel-preset-expo kökte kurulu değil, expo paketinin içinden çözülür (jest.config.js ile aynı yol).
// Not: jest.config.js `unit` projesi babel'i kendi ayarıyla çağırır; bu dosyayı kullanmaz.
const babelPresetExpo = require.resolve('babel-preset-expo', {
  paths: [require.resolve('expo/package.json')],
});

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [babelPresetExpo],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
