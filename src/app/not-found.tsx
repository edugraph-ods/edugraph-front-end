import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          {t('title')}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {t('description')}
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('backToHome')}
        </Link>
      </div>
    </div>
  );
}
