'use client';

import React, { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { ThemeProvider } from '@/components/theme-provider';
import i18n, { changeAppLanguage } from '@/i18n/i18n';

export function LanguageUpdater() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const updateLanguage = (lng: string) => {
      document.documentElement.lang = lng;
    };
    updateLanguage(i18n.language);
    i18n.on('languageChanged', updateLanguage);
    
    return () => {
      i18n.off('languageChanged', updateLanguage);
    };
  }, [i18n]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLng = localStorage.getItem('i18nextLng');
        const initialLng = savedLng || 'es';
        await changeAppLanguage(initialLng);
      } catch (error) {
        console.error('Error initializing language:', error);
      }
    };

    initializeLanguage();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <LanguageUpdater />
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
}
