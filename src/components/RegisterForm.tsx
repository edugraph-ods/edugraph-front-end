"use client";
import { useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: 'weak' };
  
  let score = 0;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  if (hasLowercase) score++;
  if (hasUppercase) score++;
  if (hasNumbers) score++;
  if (hasSpecial) score++;
  if (isLongEnough) score++;

  let label = '';
  if (score <= 1) label = 'weak';
  else if (score <= 3) label = 'medium';
  else label = 'strong';

  return { score, label };
};

export const RegisterForm = () => {
  const { t } = useTranslation('Register');
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleInputChange = (field: 'name' | 'email') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStrengthColor = () => {
    switch (passwordStrength.label) {
      case 'weak': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'strong': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength.label) {
      case 'weak': return t('weak');
      case 'medium': return t('medium');
      case 'strong': return t('strong');
      default: return '';
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const response = await signUp({
        name: formData.name,
        email: formData.email,
        password,
      });

      const token = typeof response === 'object' && response !== null
        ? 'token' in response && typeof response.token === 'string'
          ? response.token
          : 'accessToken' in response && typeof response.accessToken === 'string'
            ? response.accessToken
            : null
        : null;

      if (token) {
        document.cookie = `auth-token=${token}; path=/; max-age=86400`;
      }

      router.push('/dashboard');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        {t("title")}
      </h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700">
            {t("name")}
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={handleInputChange('name')}
            disabled={isLoading}
            placeholder={t("namePlaceholder")}
            className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-gray-900"
          />
        </div>

        {/* Email Input */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange('email')}
            disabled={isLoading}
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
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
            placeholder={t("passwordPlaceholder")}
            className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-gray-900"
          />
        </div>
        {/* Password Strength Meter */}
        {password && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength.label === 'weak' ? 'bg-red-500 w-1/3' :
                  passwordStrength.label === 'medium' ? 'bg-yellow-500 w-2/3' :
                  'bg-green-500 w-full'
                }`}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {t('Strength')}:
              </span>
              <span className={`text-sm font-medium ${getStrengthColor()}`}>
                {getStrengthLabel()}
              </span>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="group pt-2">
          <label className="flex items-start space-x-3 cursor-pointer select-none">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                disabled={isLoading}
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
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
              {t("accept")}{" "}
              <a href="#" className="text-blue-600 hover:underline">
                {t("terms")}
              </a>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] active:shadow-md cursor-pointer disabled:opacity-70"
            disabled={isLoading}
          >
            {t("submit")}
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
