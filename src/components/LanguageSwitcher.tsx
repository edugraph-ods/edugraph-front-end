'use client';

import { useTranslation } from 'react-i18next';

const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language || 'en';

  const handleLocaleChange = async (newLocale: string) => {
    if (newLocale === currentLocale) return;
    try {
      await i18n.changeLanguage(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', newLocale);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LOCALES.map(({ code }) => (
        <button
          key={code}
          onClick={() => handleLocaleChange(code)}
          className={`px-3 py-1 rounded cursor-pointer ${
            currentLocale === code
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-black'
          }`}
          aria-current={currentLocale === code ? 'true' : undefined}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
