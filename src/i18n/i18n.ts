import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';

const supportedLngs = ['en', 'es'];

const normalizeLanguageCode = (lng: string | undefined): string => {
  if (!lng) return 'en';
  const langCode = lng.split('-')[0].toLowerCase();
  return supportedLngs.includes(langCode) ? langCode : 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      es: esTranslations
    },
    lng: 'en', 
    fallbackLng: 'en', 
    supportedLngs, 
    nonExplicitSupportedLngs: false, 
    load: 'all',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => {
        return normalizeLanguageCode(lng);
      }
    },
  });

export const changeAppLanguage = (lng: string) => {
  const normalizedLng = normalizeLanguageCode(lng);
  return i18n.changeLanguage(normalizedLng);
};

export default i18n;