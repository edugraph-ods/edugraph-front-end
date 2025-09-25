'use client';

import { Inter } from 'next/font/google';
import { useState, useEffect } from 'react';
import { Providers } from './providers';
import Loading from './loading';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>EduGraph</title>
        <meta name="description" content="Educational platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.jpg" type="image/x-icon" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        {isLoading ? (
          <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <Loading />
          </div>
        ) : (
          <Providers>
            {children}
          </Providers>
        )}
      </body>
    </html>
  );
}
