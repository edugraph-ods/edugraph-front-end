import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { FiUser, FiLogOut, FiDownload, FiUpload, FiSave } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { FiChevronDown } from 'react-icons/fi';
import LanguageSwitcher from '../LanguageSwitcher';
import { ThemeToggle } from '../theme-provider';
import { readAuthToken } from '@/shared/utils/authToken';
import { useStudent } from '@/presentation/hooks/useStudent';
import type { StudentProfile } from '@/domain/entities/student';

interface DashboardHeaderProps {
  onLogout: () => void;
  onExportPdf?: () => void;
  onLoadSavedData?: () => void;
  onConfirmSelection?: () => void;
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

export const DashboardHeader = ({ onLogout, onExportPdf, onLoadSavedData, onConfirmSelection }: DashboardHeaderProps) => {
  const { t } = useTranslation('dashboard');
  const [headerLogoFailed, setHeaderLogoFailed] = useState(false);
  const { getProfile } = useStudent();

  const handleLogout = () => {
    onLogout();
  };

  const handleExportPdf = () => {
    onExportPdf?.();
  };

  const handleLoadSavedData = () => {
    onLoadSavedData?.();
  };

  const handleConfirmSelection = () => {
    onConfirmSelection?.();
  };

  const getUserInfo = (): DecodedTokenPayload | null => {
    const token = readAuthToken();
    if (!token) return null;
    return decodePayload<DecodedTokenPayload>(token);
  };

  const [userInfo, setUserInfo] = useState<DecodedTokenPayload | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setUserInfo(getUserInfo());
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!userInfo) {
        if (isMounted) {
          setStudentProfile(null);
          setProfileError(null);
          setIsProfileLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setProfileError(null);
          setIsProfileLoading(true);
        }
        const profile = await getProfile();
        if (isMounted) {
          setStudentProfile(profile);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : t('header.profileError', { defaultValue: 'No se pudo cargar el perfil.' });
          setProfileError(message);
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [getProfile, t, userInfo]);


  const tooltipContent = useMemo(() => {
    if (isProfileLoading) {
      return (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          {t('header.loadingProfile', { defaultValue: 'Cargando perfil...' })}
        </div>
      );
    }

    if (!userInfo) {
      if (profileError) {
        return (
          <div className="px-4 py-3 text-sm text-destructive">
            {profileError}
          </div>
        );
      }
      return (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          {t("header.noUser", { defaultValue: "Sesión no identificada." })}
        </div>
      );
    }
    const displayName =
      studentProfile?.name ??
      userInfo.full_name ??
      userInfo.name ??
      t('header.anonymous', { defaultValue: 'Usuario' });
    const displayEmail = studentProfile?.email ?? userInfo.email ?? 'user@example.com';
    const displayUniversity = studentProfile?.university;

    return (
      <div className="px-4 py-3 w-56">
        <p className="text-sm font-semibold text-foreground">
          {displayName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground wrap-break-word">
          {displayEmail}
        </p>
        {displayUniversity ? (
          <p className="mt-2 text-xs text-muted-foreground wrap-break-word">
            {displayUniversity}
          </p>
        ) : null}
        {profileError ? (
          <p className="mt-2 text-xs text-destructive">
            {profileError}
          </p>
        ) : null}
      </div>
    );
  }, [isProfileLoading, profileError, studentProfile, t, userInfo]);

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
          <button
            type="button"
            onClick={handleConfirmSelection}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/25 dark:hover:text-primary-foreground cursor-pointer"
          >
            <FiSave className="h-4 w-4" />
            {t("button.save")}
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
              <div className="bg-white text-foreground border border-border rounded-md shadow-lg dark:bg-neutral-900">
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
