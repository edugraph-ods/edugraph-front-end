"use client";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { writeAuthToken, extractAuthToken, clearAuthToken } from '@/shared/utils/authToken';

export const LoginForm = () => {
  
  const dashboardPath = '/dashboard';
  const { t } = useTranslation('Login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const response = await signIn(formData);
      const callbackUrlParam = searchParams.get('callbackUrl');
      const redirectPath = callbackUrlParam && callbackUrlParam.startsWith('/')
        ? callbackUrlParam
        : dashboardPath;
      const token = extractAuthToken(response);

      if (!token) {
        const responseMessage = typeof response === 'object' && response !== null
          ? 'message' in response && typeof response.message === 'string'
            ? response.message
            : 'detail' in response && typeof response.detail === 'string'
              ? response.detail
              : null
          : null;

        setError(responseMessage ?? 'Invalid credentials');
        return;
      }

      clearAuthToken();
      writeAuthToken(token);

      router.push(redirectPath);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        {t('title')}
      </h1>

      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className="space-y-2 mb-6">
          <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            placeholder={t('emailPlaceholder')}
            className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-gray-900 disabled:opacity-70"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2 mb-6">
          <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700">
            {t('password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            placeholder={t('passwordPlaceholder')}
            className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-gray-900 disabled:opacity-70"
          />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 mt-3 mb-5">
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
                {t('remember')}
              </span>
            </label>
          </div>

          <div className="w-full sm:w-auto text-center sm:text-right">
            <button
              type="button"
              className="text-sm sm:text-base font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer"
              onClick={() => router.push('/auth/recovery-password')}
            >
              {t('forgotPassword')}
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border-0 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:outline-none ring-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] active:shadow-md cursor-pointer disabled:opacity-70"
            disabled={isLoading}
            >
            {t('submit')}
          </button>
          {error && (
            <div className="text-red-500 text-sm mt-2 text-center">
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
