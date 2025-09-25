// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locale || 'en';
  try {
    return {
      locale: currentLocale,
      messages: (await import(`../locales/${currentLocale}.json`)).default
    };
  } catch (err) {
    console.error('Error cargando locale', currentLocale, err);
    return {
      locale: 'en',
      messages: (await import('../locales/en.json')).default
    };
  }
});
