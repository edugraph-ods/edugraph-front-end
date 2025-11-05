'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { JSX } from 'react';

type NextThemesProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: NextThemesProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="group inline-flex items-center justify-center rounded-md p-2 focus:outline-none transition-all duration-300 ease-in-out cursor-pointer"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  const current = (resolvedTheme ?? theme) as string | undefined;
  const isLight = current === 'light' || current === undefined;

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className={`group inline-flex items-center justify-center rounded-md p-2 focus:outline-none transition-all duration-300 ease-in-out cursor-pointer ${!isLight ? 'hover:bg-[#212121]' : ''}`}
      aria-label="Toggle theme"
      aria-pressed={!isLight}
    >
      {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 group-hover:text-white transition-colors" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}