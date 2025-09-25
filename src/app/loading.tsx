'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Loading() {
  const [progress, setProgress] = useState(0);
  const { t } = useTranslation('Loading');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6 p-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent">
          <div 
            className="absolute inset-0 rounded-full border-t-4 border-r-4 border-b-0 border-l-0 border-transparent border-t-blue-600 border-r-blue-500"
            style={{
              transform: `rotate(${progress * 3.6}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          ></div>
        </div>
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
          <span className="text-xl font-bold text-blue-600">
            {progress}%
          </span>
        </div>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {progress < 100 ? t('loading') : t('ready')}
        </h2>
        <p className="text-sm text-gray-500">
          {progress < 100 ? t('title') : t('redirecting')}
        </p>
      </div>
    </div>
  );
}