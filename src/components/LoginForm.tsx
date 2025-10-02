"use client";
import { useTranslation } from 'react-i18next';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export const LoginForm = ({ onSwitchToRegister }: LoginFormProps) => {
  const { t } = useTranslation('Login');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        {t('title')}
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            {t("email")}
          </label>
          <input
            id="email"
            type="Email"
            required
            placeholder={t("emailPlaceholder")}
            className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-gray-900"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700">
            {t("password")}
          </label>
          <input
            type="password"
            placeholder={t("passwordPlaceholder")}
            className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-gray-900"
          />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="group flex items-center">
            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="peer absolute inset-0 h-5 w-5 opacity-0 cursor-pointer"
                />
                <div className="h-5 w-5 flex items-center justify-center rounded border-2 border-gray-300 group-hover:border-blue-400 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-200 transition-colors duration-200">
                  <svg 
                    className="w-3 h-3 text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100" 
                    viewBox="0 0 20 20" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M5 10L9 14L15 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                {t("remember")}
              </span>
            </label>
          </div>

          <div className="w-full sm:w-auto text-center sm:text-right">
            <button
              type="button"
              className="text-sm sm:text-base font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer"
            >
              {t("forgotPassword")}
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] active:shadow-md cursor-pointer"
          >
            {t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
};
