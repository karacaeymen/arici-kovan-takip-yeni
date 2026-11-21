// Metro'nun `.sql` dosyalarını (Drizzle migration'ları) kaynak olarak tanıması için (TODO.md T1.4).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

module.exports = config;
