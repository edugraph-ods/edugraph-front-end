'use client';

import { usePathname, useRouter } from 'next/navigation';

const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

function getCurrentLocale(pathname: string) {
  const segments = pathname.split('/');
  const locale = segments[1] || 'en';
  return SUPPORTED_LOCALES.some(l => l.code === locale) ? locale : 'en';
}

function getPathWithLocale(pathname: string, newLocale: string) {
  const segments = pathname.split('/');
  if (SUPPORTED_LOCALES.some(locale => locale.code === segments[1])) {
    segments[1] = newLocale;
  } else {
    segments.splice(1, 0, newLocale);
  }
  
  return segments.join('/') || '/';
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const currentLocale = getCurrentLocale(pathname);

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    const newPath = getPathWithLocale(pathname, newLocale);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LOCALES.map(({ code }) => (
        <button
          key={code}
          onClick={() => handleLocaleChange(code)}
          className={`px-3 py-1 rounded ${
            currentLocale === code
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          aria-current={currentLocale === code ? 'true' : undefined}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
