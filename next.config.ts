// next.config.ts
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// PASA la ruta al archivo request.ts como primer argumento (ruta relativa al root)
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = withNextIntl({
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en'
  }
});

export default nextConfig;
