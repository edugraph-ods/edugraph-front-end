import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { FiUser, FiLogOut, FiDownload, FiUpload } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { FiChevronDown } from 'react-icons/fi';
import LanguageSwitcher from '../LanguageSwitcher';
import { ThemeToggle } from '../theme-provider';
import { readAuthToken } from '@/shared/utils/authToken';

interface DashboardHeaderProps {
  onLogout: () => void;
  onExportPdf?: () => void;
  onLoadSavedData?: () => void;
}

interface DecodedTokenPayload {
  full_name?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}
const decodePayload = <T,>(token: string): T | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = typeof window === "undefined"
      ? Buffer.from(payload, "base64").toString("utf-8")
      : atob(payload);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
};
export const DashboardHeader = ({ onLogout, onExportPdf, onLoadSavedData }: DashboardHeaderProps) => {
  const { t } = useTranslation('dashboard');
  const [headerLogoFailed, setHeaderLogoFailed] = useState(false);

  const handleLogout = () => {
    onLogout();
  };

  const handleExportPdf = () => {
    onExportPdf?.();
  };

  const handleLoadSavedData = () => {
    onLoadSavedData?.();
  };

  const getUserInfo = (): DecodedTokenPayload | null => {
    const token = readAuthToken();
    if (!token) return null;
    return decodePayload<DecodedTokenPayload>(token);
  };

  const [userInfo, setUserInfo] = useState<DecodedTokenPayload | null>(null);

  useEffect(() => {
    setUserInfo(getUserInfo());
  }, []);

  const tooltipContent = useMemo(() => {
    if (!userInfo) {
      return (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          {t("header.noUser", { defaultValue: "Sesión no identificada." })}
        </div>
      );
    }
    const { full_name, name, email } = userInfo;

    return (
      <div className="px-4 py-3 w-56">
        <p className="text-sm font-semibold text-foreground">
          {full_name ?? name ?? t("header.anonymous", { defaultValue: "Usuario" })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          {email ?? "user@example.com"}
        </p>
      </div>
    );
  }, [t, userInfo]);

  return (
    <header className="flex items-center justify-between p-4 bg-card shadow-sm border-b border-border">
        <div className="flex items-center space-x-4">
          {headerLogoFailed ? (
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold select-none border border-border">
              EG
            </div>
          ) : (
            <Image
              src="/logo.jpg"
              alt="EduGraph Logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full border border-border"
              priority
              unoptimized
              onError={() => setHeaderLogoFailed(true)}
            />
          )}
          <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-foreground transition-all duration-200 ease-out cursor-pointer hover:scale-[1.04] hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/25 dark:hover:text-primary-foreground"
          >
            <FiDownload className="h-4 w-4" />
            {t('button.export')}
          </button>
          <button
            type="button"
            onClick={handleLoadSavedData}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-foreground transition-all duration-200 ease-out cursor-pointer hover:scale-[1.04] hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/25 dark:hover:text-primary-foreground"
          >
            <FiUpload className="h-4 w-4" />
            {t('button.load')}
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="relative">
            <div className="flex items-center space-x-2 cursor-pointer group peer">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <FiUser className="text-secondary-foreground" />
              </div>
              <FiChevronDown className="group-hover:rotate-180 transition-transform text-muted-foreground" />
            </div>
            <div className="pointer-events-none opacity-0 peer-hover:opacity-100 peer-hover:pointer-events-auto transition-opacity duration-150 absolute right-0 mt-2 w-max z-10">
              <div className="bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
                {tooltipContent}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer hover:scale-105"
            title="Cerrar sesión"
          >
            <FiLogOut size={20} className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </header>
  );
};
