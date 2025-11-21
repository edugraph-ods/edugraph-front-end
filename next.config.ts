import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  async rewrites() {
    const base = (process.env.BACKEND_REWRITE_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
    const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
    return normalized
      ? [
          {
            source: '/api/v1/:path*',
            destination: `${normalized}/api/v1/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
